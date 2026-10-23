import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const defaultTaxonomy = path.resolve(packageRoot, '..');
export const pythonExecutable = fs.existsSync(path.join(packageRoot,'.venv/bin/python')) ? path.join(packageRoot,'.venv/bin/python') : 'python3';
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export function hashTree(root) {
  const entries=[];
  function walk(dir,prefix=''){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
      const name=prefix+entry.name;
      if(entry.isDirectory())walk(path.join(dir,entry.name),name+'/');
      else if(entry.isFile())entries.push([name,hash(fs.readFileSync(path.join(dir,entry.name)))]);
    }
  }
  walk(root);return hash(JSON.stringify(entries));
}

export function loadTaxonomy(root = defaultTaxonomy) {
  const topicsBytes = fs.readFileSync(path.join(root, 'data/topics.json'));
  const edgesBytes = fs.readFileSync(path.join(root, 'data/dependencies.json'));
  const topics = JSON.parse(topicsBytes);
  const edges = JSON.parse(edgesBytes);
  return {
    root, topics: topics.topics, edges: edges.dependencies,
    byId: new Map(topics.topics.map(t => [t.id, t])),
    fingerprint: { version: topics.version, topics_sha256: hash(topicsBytes), dependencies_sha256: hash(edgesBytes) }
  };
}

export function searchTopics(taxonomy, query) {
  const q = query.toLocaleLowerCase().trim();
  return taxonomy.topics.filter(t => [t.id, t.name, t.description, t.subject].some(v => String(v || '').toLocaleLowerCase().includes(q)));
}

export function resolveTopic(taxonomy, query) {
  if (taxonomy.byId.has(query)) return taxonomy.byId.get(query);
  const exact = taxonomy.topics.filter(t => (t.name || '').toLocaleLowerCase() === query.toLocaleLowerCase().trim());
  if (exact.length === 1) return exact[0];
  const candidates = exact.length ? exact : searchTopics(taxonomy, query);
  if (candidates.length === 1) return candidates[0];
  const error = new Error(candidates.length ? 'Ambiguous topic: use a stable topic ID.' : 'Unknown topic: ' + query);
  error.code = candidates.length ? 'AMBIGUOUS_TOPIC' : 'UNKNOWN_TOPIC';
  error.candidates = candidates.slice(0, 20).map(t => ({ id: t.id, name: t.name, subject: t.subject, age: [t.ageRangeStart, t.ageRangeEnd] }));
  throw error;
}

// Deliberately reviewed exceptions, not an LLM confidence heuristic.
export const knownConflicts = [{
  topicId: 'mt_VBl1T1sFCM', prerequisiteId: 'mt_ZL9qVVnpwN',
  reason: 'Stored prerequisite direction appears inconsistent with its explanatory reason. No corrected edge is established.'
}];

export function inspectGraph(topics, edges, selectedIds, mastered = []) {
  const ids = new Set(topics.map(t => t.id));
  const parents = new Map();
  for (const edge of edges) {
    if (!ids.has(edge.topicId) || !ids.has(edge.prerequisiteId)) throw new Error('Graph contains an unknown endpoint.');
    if (edge.topicId === edge.prerequisiteId) throw new Error('Graph contains a self-dependency.');
    if (edge.strength === 'hard') {
      if (!parents.has(edge.topicId)) parents.set(edge.topicId, []);
      parents.get(edge.topicId).push(edge.prerequisiteId);
    }
  }
  const visited = new Set(), active = new Set(), ordered = [];
  function visit(id) {
    if (!ids.has(id)) throw new Error('Unknown graph topic ' + id);
    if (active.has(id)) throw new Error('Hard-prerequisite cycle detected at ' + id);
    if (visited.has(id)) return;
    active.add(id);
    for (const parent of parents.get(id) || []) visit(parent);
    active.delete(id); visited.add(id); ordered.push(id);
  }
  for (const id of selectedIds) visit(id);
  const selected = new Set(selectedIds), known = new Set(mastered);
  return {
    selected_order: ordered.filter(id => selected.has(id)),
    hard_ancestor_ids: ordered.filter(id => !selected.has(id)),
    background_ids: ordered.filter(id => !selected.has(id) && !known.has(id)),
    declared_mastered_ids: mastered,
    conflicts: knownConflicts.filter(e => visited.has(e.topicId) && visited.has(e.prerequisiteId)),
    expansion: 'Background is reported, not silently generated or assumed mastered.'
  };
}
