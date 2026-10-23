#!/usr/bin/env python3
"""Validate research references and taxonomy snapshots, without third-party dependencies.

This validates traceability/integrity, not source authenticity or scientific validity.
"""
import argparse
import copy
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
BANDS = {'6-8', '9-12', '13-17'}
ROLES = {'direct_support', 'foundation', 'analogy_only'}

class Invalid(ValueError):
    pass

def require(condition, message):
    if not condition:
        raise Invalid(message)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def acyclic(nodes, edges, label):
    outgoing = {node: [] for node in nodes}
    indegree = {node: 0 for node in nodes}
    for a, b in edges:
        require(a in outgoing and b in outgoing, f'{label}: unresolved endpoint')
        outgoing[b].append(a)
        indegree[a] += 1
    pending = [node for node in nodes if not indegree[node]]
    count = 0
    while pending:
        node = pending.pop()
        count += 1
        for child in outgoing[node]:
            indegree[child] -= 1
            if not indegree[child]:
                pending.append(child)
    require(count == len(nodes), f'{label}: cycle found')

class NormalizedText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, text):
        if text.strip():
            self.parts.append(text.strip())
    def lines(self):
        return '\n'.join(self.parts).splitlines()

def validate(data, sources, topics, dependencies, source_html=None):
    require(data['formatVersion'] == '1.0', 'unsupported format')
    taxonomy = data['taxonomy']
    require(digest(ROOT / taxonomy['relativeTopicsPath']) == taxonomy['topicsSha256'], 'taxonomy topics changed; review mappings')
    require(digest(ROOT / taxonomy['relativeDependenciesPath']) == taxonomy['dependenciesSha256'], 'taxonomy dependencies changed; review mappings')
    require(len(topics) == taxonomy['topicCount'], 'topic count mismatch')
    require(len(dependencies) == taxonomy['dependencyCount'], 'dependency count mismatch')
    acyclic(topics, [(e['topicId'], e['prerequisiteId']) for e in dependencies], 'stored taxonomy')
    require(len(sources) == len({s['id'] for s in sources}), 'duplicate source ID')
    source_index = {s['id']: s for s in sources}
    for source in sources:
        require(source['url'].startswith('https://'), 'source must have HTTPS URL')
        require(source['title'] and source['publisher'] and source['sourceType'], 'source metadata incomplete')
        if source['access']['status'] == 'retrieved':
            require(source['access']['httpStatus'] == 200, 'retrieved source HTTP status invalid')
            require(len(source['access']['sha256']) == 64, 'source hash missing')
            require(source.get('anchors') and source.get('sections'), 'retrieved source anchors missing')
            section_ids = {s['id'] for s in source['sections']}
            for anchor in source['anchors'].values():
                require(anchor['sectionId'] in section_ids, 'unresolved source section')
                require(anchor['searchText'] and anchor['normalizedTextLines'], 'missing retrieval anchor')
        else:
            require(source.get('usedForClaims') is False, 'unread source used for claims')
    model_ids = [m['id'] for m in data['models']]
    require(len(model_ids) == len(set(model_ids)), 'duplicate model ID')
    require(15 <= len(model_ids) <= 25, 'unexpected curation size')
    proposed_edges = []
    mapping_count = 0
    distinct_topics = set()
    hard_edges = set()
    mapped_criteria = 0
    for model in data['models']:
        require(model['attribution'] in data['attributionCategories'], 'unknown attribution category')
        require(model['definition'] and model['prerequisiteConcepts'], 'missing model purpose/prerequisites')
        require(model['citations'], 'uncited model')
        for citation in model['citations']:
            require(citation['sourceId'] in source_index, 'unresolved source ID')
            source = source_index[citation['sourceId']]
            require(source['access']['status'] == 'retrieved', 'citation points to unread source')
            require(citation['anchorId'] in source['anchors'], 'unresolved source anchor')
            require(citation['claim'] and citation['confidence'], 'citation qualification missing')
        require(set(model['ageBands']) == BANDS, 'missing course age band')
        for band in model['ageBands'].values():
            require(set(band) == {'objective', 'learnerAction', 'observableCheck', 'transferTask'}, 'incomplete lesson contract')
            require(all(isinstance(v, str) and len(v) > 12 for v in band.values()), 'empty lesson contract item')
        for parent in model['proposedPrerequisiteModelIds']:
            require(parent in model_ids and parent != model['id'], 'unresolved model prerequisite')
            proposed_edges.append((model['id'], parent))
        coverage = model['taxonomyCoverage']
        require(set(coverage) == ROLES | {'missing'}, 'coverage categories incorrect')
        require(coverage['missing'] and all(isinstance(x, str) for x in coverage['missing']), 'explicit gaps required')
        for role in ROLES:
            seen = set()
            for item in coverage[role]:
                mapping_count += 1
                tid = item['topicId']
                require(tid in topics, f'unresolved topic ID {tid}')
                require(tid not in seen, 'duplicate mapping in coverage role')
                seen.add(tid)
                distinct_topics.add(tid)
                topic = topics[tid]
                require(item['coverageRole'] == role, 'coverage role mismatch')
                require(item['topicName'] == topic['name'], 'topic name mismatch')
                require(item['ageRange'] == [topic['ageRangeStart'], topic['ageRangeEnd']], 'topic age snapshot mismatch')
                require(item['supports'] and item['limitation'], 'mapping scope/limit absent')
                require(item['sourceSupport'], 'mapping lacks textual support')
                criterion_count = 0
                for support in item['sourceSupport']:
                    field = support['field']
                    require(field in {'evidence', 'description', 'assessmentPrompt'}, 'unsupported field')
                    if field == 'evidence':
                        idx = support['index']
                        require(type(idx) is int and 0 <= idx < len(topic[field]), 'invalid evidence index')
                        require(support['text'] == topic[field][idx], 'evidence text mismatch')
                        criterion_count += 1
                    else:
                        require(support['text'] == topic[field], 'description/prompt text mismatch')
                require(item['hasMappedEvidenceCriteria'] == bool(criterion_count), 'evidence status mismatch')
                if role == 'direct_support':
                    require(criterion_count > 0, 'direct support requires mapped evidence criteria')
                mapped_criteria += criterion_count
                actual = [dict(e, prerequisiteName=topics[e['prerequisiteId']]['name']) for e in dependencies
                          if e['topicId'] == tid and e['strength'] == 'hard']
                expected_key = lambda e: (e['topicId'], e['prerequisiteId'], e['reason'])
                require(sorted(item['directHardPrerequisites'], key=expected_key) == sorted(actual, key=expected_key),
                        f'prerequisite edge snapshot mismatch for {tid}')
                hard_edges.update((e['topicId'], e['prerequisiteId']) for e in actual)
    acyclic(model_ids, proposed_edges, 'proposed model sequence')
    checked_anchors = 0
    source_verification = 'not run: supply --source-html with the retrieved pinned HTML'
    if source_html:
        require(source_html.is_file(), 'source HTML file missing')
        source = source_index['almanack-mirror']
        require(digest(source_html) == source['access']['sha256'], 'source HTML hash mismatch')
        require(source_html.stat().st_size == source['access']['byteCount'], 'source byte count mismatch')
        parser = NormalizedText()
        parser.feed(source_html.read_text(encoding='utf-8'))
        lines = parser.lines()
        for anchor in source['anchors'].values():
            for index in anchor['normalizedTextLines']:
                require(anchor['searchText'].casefold() in lines[index - 1].casefold(), 'source retrieval anchor mismatch')
            checked_anchors += 1
        source_verification = 'passed: pinned HTML SHA-256, byte count and every stored source anchor'
    return {'status': 'passed', 'modelCount': len(model_ids), 'mappingCount': mapping_count,
            'distinctMappedTopics': len(distinct_topics), 'mappedEvidenceEntries': mapped_criteria,
            'distinctDirectHardPrerequisiteEdges': len(hard_edges), 'sourceAnchorsChecked': checked_anchors,
            'taxonomyGraph': 'acyclic; stored edge direction preserved',
            'proposedModelGraph': 'acyclic', 'sourceVerification': source_verification,
            'limits': ['Structural integrity and exact dataset references are checked; semantic mappings remain editorial judgments.',
                       'No source authenticity, independent corroboration, empirical psychology validation or learner mastery is established.',
                       'Lessons are proposals; no browser lesson or learner trial was run by this research package.']}

def negative_tests(data, sources, topics, dependencies):
    cases = []
    wrong = copy.deepcopy(data)
    wrong['models'][0]['taxonomyCoverage']['foundation'][0]['topicId'] = 'fabricated_topic'
    cases.append(('fabricated topic ID rejected', wrong))
    wrong = copy.deepcopy(data)
    wrong['models'][0]['taxonomyCoverage']['foundation'][0]['sourceSupport'][0]['text'] = 'fabricated criterion'
    cases.append(('fabricated evidence text rejected', wrong))
    wrong = copy.deepcopy(data)
    wrong['models'][0]['citations'][0]['sourceId'] = 'fs-worldly'
    cases.append(('blocked unread source citation rejected', wrong))
    wrong = copy.deepcopy(data)
    wrong['models'][0]['citations'][0]['anchorId'] = 'fabricated_anchor'
    cases.append(('unresolved source anchor rejected', wrong))
    wrong = copy.deepcopy(data)
    wrong['models'][0]['proposedPrerequisiteModelIds'] = ['lollapalooza']
    wrong['models'][-1]['proposedPrerequisiteModelIds'] = ['latticework']
    cases.append(('cyclic proposed sequence rejected', wrong))
    wrong = copy.deepcopy(data)
    item = next(x for m in wrong['models'] for role in ROLES for x in m['taxonomyCoverage'][role]
                if x['directHardPrerequisites'])
    item['directHardPrerequisites'][0]['topicId'], item['directHardPrerequisites'][0]['prerequisiteId'] = (
        item['directHardPrerequisites'][0]['prerequisiteId'], item['directHardPrerequisites'][0]['topicId'])
    cases.append(('reversed prerequisite edge rejected', wrong))
    passed = []
    for label, wrong in cases:
        try:
            validate(wrong, sources, topics, dependencies)
        except Invalid:
            passed.append(label)
        else:
            raise Invalid(f'negative test did not reject: {label}')
    return passed

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-html', type=Path)
    parser.add_argument('--self-test', action='store_true')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    try:
        data = json.loads((HERE / 'mental-models.json').read_text())
        sources = json.loads((HERE / 'sources.json').read_text())['sources']
        topic_rows = json.loads((ROOT / 'data/topics.json').read_text())['topics']
        require(len(topic_rows) == len({t['id'] for t in topic_rows}), 'duplicate taxonomy topic ID')
        topics = {t['id']: t for t in topic_rows}
        dependencies = json.loads((ROOT / 'data/dependencies.json').read_text())['dependencies']
        report = validate(data, sources, topics, dependencies, args.source_html)
        if args.self_test:
            report['negativeTestsPassed'] = negative_tests(data, sources, topics, dependencies)
        output = json.dumps(report, indent=2, ensure_ascii=False) + '\n'
        if args.report:
            args.report.write_text(output)
        sys.stdout.write(output)
    except (Invalid, KeyError, IndexError, ValueError, OSError) as error:
        print(f'VALIDATION FAILED: {error}', file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
