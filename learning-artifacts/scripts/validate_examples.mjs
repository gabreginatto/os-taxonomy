import fs from 'node:fs';
import path from 'node:path';
import { packageRoot } from '../src/taxonomy.mjs';
import { createPlan } from '../src/planner.mjs';
import { catalog } from '../src/catalog.mjs';
import { generate } from '../src/generator.mjs';
import { verify, runProcess } from '../src/verify.mjs';
import { renderVideo } from '../src/video.mjs';
import { loadExtension } from '../src/extensions.mjs';
import { verifyAsset } from '../src/asset-check.mjs';
import { serveDirectory } from '../src/server.mjs';
import { pythonExecutable } from '../src/taxonomy.mjs';

const root=path.join(packageRoot,'output','validation-'+new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(root,{recursive:true});
const checks=[];
const record=async(name,fn)=>{
  try{const result=await fn();checks.push({name,status:'passed',result});process.stdout.write(name+': passed\n');return result;}
  catch(error){checks.push({name,status:'failed',error:error.message});process.stdout.write(name+': failed: '+error.message+'\n');}
};
const requirePassed=report=>{if(report.status!=='passed')throw new Error(JSON.stringify(report));return {checks:report.checks.length,browser_checks:report.browser.checks.length,fingerprint:report.validation_fingerprint};};
await record('six-lesson browser series',async()=>{
  const dir=path.join(root,'showcase');
  await generate(createPlan({topics:catalog.flatMap(p=>p.topicIds)}),dir);
  return requirePassed(await verify(dir));
});
await record('new-topic extension browser',async()=>{
  const plugin=await loadExtension(path.join(packageRoot,'examples/fraction-notation.plugin.mjs'));
  const dir=path.join(root,'custom-notation');
  await generate(createPlan({topics:plugin.topicIds,plugins:[plugin]}),dir);
  return requirePassed(await verify(dir));
});
for(const [name,id]of [['fractions','mt_FbDKeLfBCo'],['daynight','mt_q15w--Fb5H']]){
  await record(name+' interactive and MP4',async()=>{
    const dir=path.join(root,name);
    await generate(createPlan({topics:[id],outputs:['interactive_browser','mp4']}),dir);
    requirePassed(await verify(dir,{onlyBrowser:true}));
    const video=await renderVideo(dir,{seconds:6,fps:10});
    const result=requirePassed(await verify(dir));
    return {...result,video};
  });
}
await record('reject frozen video with an otherwise valid duration',async()=>{
  const exports=path.join(root,'fractions/exports');
  const frozen=path.join(root,'frozen-negative-fixture.mp4');
  const encoded=await runProcess('ffmpeg',['-v','error','-loop','1','-i',path.join(exports,'frame-0.png'),'-t','6','-r','10','-pix_fmt','yuv420p','-c:v','libx264',frozen],{timeout:60000});
  if(encoded.code!==0)throw new Error('Unable to create the deliberate negative fixture.');
  const stage=path.join(exports,fs.readdirSync(exports).find(n=>n.startsWith('composition-')));
  const service=await serveDirectory(stage);
  try {
    const rejected=await runProcess(pythonExecutable,[path.join(packageRoot,'scripts/verify_video.py'),'--url','http://127.0.0.1:'+service.port,'--video',frozen,'--samples',path.join(exports,'expected-samples.json'),'--report',path.join(root,'negative-video-report.json')],{timeout:90000});
    const report=JSON.parse(rejected.stdout);
    if(rejected.code===0||report.status!=='failed')throw new Error('A frozen video was incorrectly accepted.');
    return {negative_fixture:'rejected',reason:report.error};
  } finally {await service.close();}
});
await record('Blender GLB export and browser load',async()=>{
  const asset=path.join(root,'cube.glb');
  const exported=await runProcess('blender',['--background','--factory-startup','--threads','2','--python-exit-code','1','--python',path.join(packageRoot,'scripts/blender_asset.py'),'--','--kind','cube','--out',asset],{timeout:120000});
  if(exported.code!==0)throw new Error(exported.stdout+exported.stderr);
  return verifyAsset(path.join(root,'showcase'),asset,path.join(root,'asset-check.json'));
});
const summary={status:checks.every(c=>c.status==='passed')?'passed':'failed',root,checks,limits:['Automated/agent review only; no child learning trials.','Learner-device performance is not measured.','MCP bridge and interactive decks are not configured.']};
fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(packageRoot,'output/latest-validation.json'),JSON.stringify({root,status:summary.status},null,2)+'\n');
console.log(JSON.stringify({status:summary.status,root,checks:checks.map(c=>({name:c.name,status:c.status,error:c.error}))},null,2));
if(summary.status!=='passed')process.exitCode=1;
