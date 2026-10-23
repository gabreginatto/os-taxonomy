import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { packageRoot, loadTaxonomy, hash, pythonExecutable } from './taxonomy.mjs';
import { validateManifest, verifySourceHashes, validationFingerprint, videoValidationFingerprint } from './validation.mjs';
import { checkModels } from './model-checks.mjs';
import { serveDirectory } from './server.mjs';
import { loadExtension, checkExtensionModel } from './extensions.mjs';

export function runProcess(command,args,options={}) {
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{...options,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';
    child.stdout.on('data',chunk=>{stdout+=chunk;});
    child.stderr.on('data',chunk=>{stderr+=chunk;});
    child.on('error',reject);
    child.on('close',(code,signal)=>resolve({code,signal,stdout,stderr}));
  });
}
export async function verify(root,{onlyBrowser=false,chromium='/usr/bin/chromium'}={}) {
  root=path.resolve(root);
  const manifest=validateManifest(JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))));
  const checks=[];
  const check=(name,fn)=>{try{fn();checks.push({name,status:'passed'});}catch(error){checks.push({name,status:'failed',error:error.message});}};
  check('accepted source hashes',()=>verifySourceHashes(root,manifest));
  check('taxonomy evidence references',()=>{
    const taxonomy=loadTaxonomy();
    if(JSON.stringify(taxonomy.fingerprint)!==JSON.stringify(manifest.source))throw new Error('Taxonomy fingerprint changed');
    for(const lesson of manifest.lessons){
      const topic=taxonomy.byId.get(lesson.topic_id);
      if(!topic)throw new Error('Unknown topic');
      for(const c of lesson.coverage)if(topic.evidence[c.index]!==c.source_evidence)throw new Error('Evidence mismatch');
    }
    if(JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'source/lesson.json'))).lessons)!==JSON.stringify(manifest.lessons))throw new Error('Bundle lesson metadata does not match manifest.');
  });
  if(!checks.some(c=>c.status==='failed')) {
    try {
      if(manifest.lessons[0].extension) {
        const plugin=await loadExtension(path.join(root,'source/extension.mjs'),{artifactRoot:root});
        const lesson=manifest.lessons[0];
        if(plugin.id!==lesson.plugin_id||plugin.version!==lesson.plugin_version||!plugin.topicIds.includes(lesson.topic_id))throw new Error('Extension identity diverged from the manifest.');
        if(plugin.extension.sha256!==lesson.extension.sha256)throw new Error('Reviewed extension source changed. Replan and regenerate; old evidence/review claims cannot carry over.');
        checks.push(...checkExtensionModel(plugin));
      }
      else {
        const artifactModels=await import(pathToFileURL(path.join(root,'source/models.mjs')).href+'?source='+manifest.fingerprints.accepted_source);
        checks.push(...checkModels(manifest.lessons.map(l=>l.plugin_id),artifactModels.getModel));
      }
    } catch(error){checks.push({name:'artifact model fixtures',status:'failed',error:error.message});}
  }
  let browser={status:'not_run',profile:{}};
  if(!checks.some(c=>c.status==='failed')) {
    const server=await serveDirectory(root);
    try {
      const result=await runProcess(pythonExecutable,[path.join(packageRoot,'scripts/verify_browser.py'),'--url','http://127.0.0.1:'+server.port,'--artifact',root,'--chromium',chromium],{cwd:packageRoot,timeout:180000});
      try {browser=JSON.parse(result.stdout.trim());} catch {browser={status:'failed',profile:{},checks:[{name:'browser runner',status:'failed',error:result.stderr||result.stdout||'No report produced'}]};}
      if(result.code!==0&&browser.status==='passed')browser.status='failed';
    } finally {await server.close();}
  }
  checks.push({name:'browser acceptance',status:browser.status==='passed'?'passed':'failed'});
  if(manifest.requested_outputs.includes('mp4')&&!onlyBrowser) {
    check('requested MP4 file and source fingerprint',()=>{
      const video=manifest.outputs.mp4;
      if(video?.status!=='verified')throw new Error('Run the video command and verify its actual output.');
      if(video.video_validation_fingerprint!==videoValidationFingerprint()||video.frame_comparison?.status!=='passed')throw new Error('Video validation is stale or incomplete. Export a fresh artifact using the current checks.');
      if(video.source_fingerprint!==manifest.fingerprints.accepted_source)throw new Error('MP4 was rendered from stale source.');
      if(!video.entry||path.isAbsolute(video.entry)||video.entry.split(/[\\/]/).includes('..'))throw new Error('Unsafe video entry');
      if(hash(fs.readFileSync(path.join(root,video.entry)))!==video.sha256)throw new Error('MP4 file/hash mismatch');
    });
  }
  const passed=checks.every(c=>c.status==='passed');
  const report={schema_version:'1.0',status:passed?'passed':'failed',scope:onlyBrowser?'interactive_browser':'requested_outputs',checks,browser,validation_fingerprint:validationFingerprint(manifest,browser.profile),human_review_status:'not_performed',content_review:'Catalog fixtures and evidence references checked. Reference links and content still require editorial review for distribution.',device_performance:'not_measured'};
  fs.mkdirSync(path.join(root,'checks'),{recursive:true});
  fs.writeFileSync(path.join(root,'checks/validation-report.json'),JSON.stringify(report,null,2)+'\n');
  manifest.validation=report;
  manifest.outputs.interactive_browser.status=browser.status==='passed'&&checks.filter(c=>!c.name.startsWith('requested MP4')).every(c=>c.status==='passed')?'verified':'failed';
  const outstanding=manifest.requested_outputs.includes('mp4')&&(onlyBrowser||manifest.outputs.mp4?.status!=='verified');
  manifest.status=passed?(manifest.blocked_topics?.length?'partial_batch':outstanding?'built':'validated'):'failed';
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return report;
}
