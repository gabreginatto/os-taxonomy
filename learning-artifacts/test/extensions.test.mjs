import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { loadExtension, checkExtensionModel } from '../src/extensions.mjs';
import { createPlan } from '../src/planner.mjs';
import { packageRoot, hash } from '../src/taxonomy.mjs';
import { generate } from '../src/generator.mjs';
import { rebuild } from '../src/generator.mjs';
import { verify } from '../src/verify.mjs';

test('a custom source-reviewed plugin extends a topic outside the built-in catalog',async t=>{
  const plugin=await loadExtension(path.join(packageRoot,'examples/fraction-notation.plugin.mjs'));
  assert.deepEqual(checkExtensionModel(plugin).filter(c=>c.status!=='passed'),[]);
  const plan=createPlan({topics:['mt_vKcxX6iNOA'],plugins:[plugin]});
  assert.equal(plan.status,'planned');
  assert.equal(plan.lessons[0].extension.sha256.length,64);
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'taxonomy-extension-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  await generate(plan,path.join(root,'artifact'));
  assert.ok(fs.existsSync(path.join(root,'artifact/source/extension.mjs')));
});
test('unreviewed custom content stays a plan and fixture errors are real failures',async()=>{
  const plugin=await loadExtension(path.join(packageRoot,'examples/fraction-notation.plugin.mjs'));
  const unreviewed={...plugin,contentReview:{status:'pending'}};
  assert.equal(createPlan({topics:['mt_vKcxX6iNOA'],plugins:[unreviewed]}).status,'needs_content_review');
  const wrong={...plugin,observe:s=>({...s,choice:'wrong'})};
  assert.ok(checkExtensionModel(wrong).some(c=>c.status==='failed'));
});
test('canvas extensions preserve their declared renderer',async()=>{
  const plugin=await loadExtension(path.join(packageRoot,'examples/fraction-notation.plugin.mjs'));
  const plan=createPlan({topics:plugin.topicIds,plugins:[{...plugin,representation:'canvas2d'}]});
  assert.equal(plan.lessons[0].route.representation,'canvas2d');
});
test('changed extension code cannot retain the old reviewed source claims',async t=>{
  const plugin=await loadExtension(path.join(packageRoot,'examples/fraction-notation.plugin.mjs'));
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'taxonomy-extension-review-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const dir=path.join(root,'artifact');
  await generate(createPlan({topics:plugin.topicIds,plugins:[plugin]}),dir);
  fs.appendFileSync(path.join(dir,'source/extension.mjs'),'\n// new source requires new review/plan\n');
  await rebuild(dir);
  const report=await verify(dir);
  assert.equal(report.status,'failed');
  assert.ok(report.checks.some(c=>c.error?.includes('Reviewed extension source changed')));
});
test('declared assets are copied, checked, and resolved inside a portable artifact',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'taxonomy-extension-assets-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const asset=path.join(root,'fixture.bin');fs.writeFileSync(asset,'asset transport fixture; GLB rendering is tested separately');
  const declaration={path:'./fixture.bin',target:'assets/fixture.bin',sha256:hash(fs.readFileSync(asset)),license:'authored_fixture',provenance:'transport contract test'};
  const original=fs.readFileSync(path.join(packageRoot,'examples/fraction-notation.plugin.mjs'),'utf8');
  const source=path.join(root,'extension.mjs');
  fs.writeFileSync(source,original.replace("id:'fraction-notation-extension'","assetFiles:"+JSON.stringify([declaration])+",id:'fraction-notation-extension'"));
  const plugin=await loadExtension(source),dir=path.join(root,'artifact');
  await generate(createPlan({topics:plugin.topicIds,plugins:[plugin]}),dir);
  assert.equal(fs.readFileSync(path.join(dir,'assets/fixture.bin'),'utf8'),fs.readFileSync(asset,'utf8'));
  fs.rmSync(asset);
  const portable=await loadExtension(path.join(dir,'source/extension.mjs'),{artifactRoot:dir});
  assert.equal(portable.assetFiles[0].sha256,declaration.sha256);
  fs.appendFileSync(path.join(dir,'assets/fixture.bin'),'changed');
  await assert.rejects(loadExtension(path.join(dir,'source/extension.mjs'),{artifactRoot:dir}),/checksum/);
});
