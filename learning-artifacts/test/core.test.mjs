import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadTaxonomy, resolveTopic, inspectGraph } from '../src/taxonomy.mjs';
import { createPlan } from '../src/planner.mjs';
import { routeTools } from '../src/router.mjs';
import { modelKeys } from '../src/models.mjs';
import { checkModels } from '../src/model-checks.mjs';
import { generate, rebuild } from '../src/generator.mjs';
import { verify } from '../src/verify.mjs';
import { verifySourceHashes, validateManifest } from '../src/validation.mjs';
import { serveDirectory } from '../src/server.mjs';

const taxonomy=loadTaxonomy();
test('exact IDs resolve; real repeated names require disambiguation',()=>{
  assert.equal(resolveTopic(taxonomy,'mt_FbDKeLfBCo').name,'Equivalent fractions');
  assert.throws(()=>resolveTopic(taxonomy,'Understanding fractions'),error=>error.code==='AMBIGUOUS_TOPIC'&&error.candidates.length>1);
  assert.throws(()=>resolveTopic(taxonomy,'mt_nonexistent'),error=>error.code==='UNKNOWN_TOPIC');
});
test('transitive order is preserved through unselected prerequisites',()=>{
  const topics=['A','B','C'].map(id=>({id}));
  const edges=[{topicId:'A',prerequisiteId:'B',strength:'hard'},{topicId:'B',prerequisiteId:'C',strength:'hard'}];
  const graph=inspectGraph(topics,edges,['A','C']);
  assert.deepEqual(graph.selected_order,['C','A']);assert.deepEqual(graph.background_ids,['B']);
  assert.throws(()=>inspectGraph(topics,[...edges,{topicId:'C',prerequisiteId:'A',strength:'hard'}],['A']),/cycle/);
});
test('known semantic conflict is preserved and blocks the affected sound sequence',()=>{
  const plan=createPlan({topics:['mt_VBl1T1sFCM','mt__00ZSLnB7p'],taxonomy});
  assert.equal(plan.status,'needs_review');
  assert.equal(plan.graph.conflicts[0].topicId,'mt_VBl1T1sFCM');
  assert.equal(plan.graph.conflicts[0].prerequisiteId,'mt_ZL9qVVnpwN');
});
test('unsupported taxonomy topics remain honest plans; mixed batches retain status',()=>{
  const unsupported=createPlan({topics:['mt_vKcxX6iNOA'],taxonomy});
  assert.equal(unsupported.status,'needs_content_review');
  assert.equal(unsupported.lessons[0].plugin_id,null);
  const mixed=createPlan({topics:['mt_FbDKeLfBCo','mt_vKcxX6iNOA'],taxonomy});
  assert.equal(mixed.status,'partial_batch');
});
test('tool routes reflect instructional need and preserve hard requirements',()=>{
  assert.equal(routeTools().representation,'html_svg');
  assert.equal(routeTools({spatial:true}).representation,'threejs');
  assert.equal(routeTools({spatial:true,capabilities:{webgl2:false}}).status,'blocked_capability');
  assert.equal(routeTools({spatial:true,preference:'html_svg'}).status,'blocked_capability');
  assert.equal(routeTools({customMesh:true}).decisions.at(-1).tool,'headless_blender');
  assert.equal(routeTools({customMesh:true,liveBlenderAuthoring:true,capabilities:{blender_mcp:true}}).decisions.at(-1).tool,'blender_mcp');
  assert.equal(routeTools({outputs:['mp4']}).decisions.at(-1).tool,'hyperframes');
});
test('all catalog domain models pass meaningful independent fixtures',()=>{
  const checks=checkModels(modelKeys);assert.ok(checks.length>=20);assert.deepEqual(checks.filter(c=>c.status!=='passed'),[]);
});
test('generation is isolated, local, refuses overwrite, and detects changed accepted source',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'taxonomy-compiler-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const dir=path.join(root,'lesson'),plan=createPlan({topics:['mt_FbDKeLfBCo'],taxonomy});
  await generate(plan,dir);
  const manifest=validateManifest(JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))));
  assert.equal(verifySourceHashes(dir,manifest),true);
  await assert.rejects(generate(plan,dir),/already exists/);
  await assert.rejects(generate(createPlan({topics:['mt_vKcxX6iNOA']}),path.join(root,'unsupported')),/unresolved/);
  const server=await serveDirectory(dir);t.after(()=>server.close());
  assert.equal((await fetch('http://127.0.0.1:'+server.port+'/')).status,200);
  assert.equal((await fetch('http://127.0.0.1:'+server.port+'/app.js')).status,200);
  fs.appendFileSync(path.join(dir,'source/models.mjs'),'\n// changed\n');
  assert.throws(()=>verifySourceHashes(dir,manifest),/changed since generation/);
});
test('edited artifact models fail independent fixtures even after rebuilding',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'taxonomy-model-regression-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const dir=path.join(root,'artifact');
  await generate(createPlan({topics:['mt_FbDKeLfBCo']}),dir);
  const source=path.join(dir,'source/models.mjs');
  fs.writeFileSync(source,fs.readFileSync(source,'utf8').replaceAll('s.numerator * 2 === s.denominator','true'));
  await rebuild(dir);
  const report=await verify(dir);
  assert.equal(report.status,'failed');
  assert.ok(report.checks.some(c=>c.name==='fractions: fixed independent examples'&&c.status==='failed'));
});
test('rebuilding cannot silently change the lesson evidence manifest',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'taxonomy-manifest-regression-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const dir=path.join(root,'artifact');
  await generate(createPlan({topics:['mt_FbDKeLfBCo']}),dir);
  const metadata=path.join(dir,'source/lesson.json');
  const value=JSON.parse(fs.readFileSync(metadata));value.lessons[0].name='Unrecorded lesson';
  fs.writeFileSync(metadata,JSON.stringify(value));
  await assert.rejects(rebuild(dir),/metadata diverged/);
});
