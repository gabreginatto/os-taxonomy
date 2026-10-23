import { loadTaxonomy, resolveTopic, inspectGraph, hash } from './taxonomy.mjs';
import { forTopic } from './catalog.mjs';
import { routeTools } from './router.mjs';

export function createPlan({ topics, age, outputs = ['interactive_browser'], mastered = [], plugins = [], taxonomy = loadTaxonomy() }) {
  if (!topics?.length) throw new Error('Supply at least one --topic ID or name.');
  if (age !== undefined && (!Number.isInteger(age) || age < 3 || age > 18)) throw new Error('Age must be an integer from 3 to 18.');
  if (outputs.some(o => !['interactive_browser', 'mp4'].includes(o))) throw new Error('Supported outputs: interactive_browser, mp4. Deck support is not implemented.');
  const resolved = [...new Map(topics.map(q => { const t = resolveTopic(taxonomy, q); return [t.id, t]; })).values()];
  if(plugins.length&&resolved.length!==1)throw new Error('Custom extensions currently build one topic per artifact. Generate separate units for a course.');
  for (const id of mastered) if (!taxonomy.byId.has(id)) throw new Error('Unknown mastered topic ID ' + id);
  const graph = inspectGraph(taxonomy.topics, taxonomy.edges, resolved.map(t => t.id), mastered);
  const entries = graph.selected_order.map(id => {
    const topic = taxonomy.byId.get(id), plugin = plugins.find(p=>p.topicIds.includes(id)) || forTopic(id);
    if(plugin)for(const c of plugin.coverage)if(!Number.isInteger(c.index)||!topic.evidence[c.index])throw new Error('Plugin claims a missing taxonomy evidence criterion.');
    const relevant = inspectGraph(taxonomy.topics, taxonomy.edges, [id], mastered);
    const conflicts = relevant.conflicts;
    const status = conflicts.length ? 'needs_review' : plugin && (!plugin.extension||plugin.contentReview?.status==='source_reviewed') ? 'planned' : 'needs_content_review';
    return {
      topic_id: id, name: topic.name, subject: topic.subject, domain: topic.domain,
      topic_age_range: [topic.ageRangeStart, topic.ageRangeEnd],
      age: age ?? topic.ageRangeStart ?? 8,
      age_assumption: age === undefined ? 'Uses the lower documented age as a presentation default; no learner mastery is inferred.' : null,
      status, plugin_id: plugin?.id ?? null, plugin_version: plugin?.version ?? null,
      ...(plugin?.extension?{extension:plugin.extension}:{}),
      evidence: topic.evidence,
      coverage: plugin?.coverage.map(c => ({ ...c, source_evidence: topic.evidence[c.index] })) ?? [],
      standards: topic.standards,
      assessment_prompt: topic.assessmentPrompt,
      route: plugin ? { ...routeTools({spatial:plugin.representation==='threejs',dense2d:plugin.representation==='canvas2d',customMesh:plugin.assetRequirement==='custom_mesh',coordinatedMotion:true,outputs}), animation: 'gsap_presentation_only', instructional_reason: plugin.reason, blender: plugin.assetRequirement==='custom_mesh'?'headless_asset_fabrication_or_verified_cache':'not_needed_for_primitive_geometry_or_diagrams', hyperframes: outputs.includes('mp4') ? 'requested_video_adapter' : 'not_requested' } : null,
      assumptions: plugin?.assumptions ?? [],
      sources: plugin?.sources ?? [],
      background_ids: relevant.background_ids, conflicts,
      content_status: plugin?.extension ? 'extension_source_review_recorded_not_expert_endorsed' : plugin ? 'catalog_rules_with_public_reference_links_not_expert_reviewed' : 'new_model_required',
      human_review_status: 'not_performed'
    };
  });
  const status = entries.every(e => e.status === 'planned') ? 'planned' : entries.some(e => e.status === 'planned') ? 'partial_batch' : entries.some(e => e.status === 'needs_review') ? 'needs_review' : 'needs_content_review';
  const plan = { schema_version: '1.0', kind: 'lesson_plan', status, source: taxonomy.fingerprint, requested_outputs: outputs, graph, lessons: entries };
  return { ...plan, fingerprint: hash(JSON.stringify(plan)) };
}
