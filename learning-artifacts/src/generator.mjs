import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'esbuild';
import { packageRoot, loadTaxonomy, hash, hashTree } from './taxonomy.mjs';
import { catalog } from './catalog.mjs';
import { validateManifest, fingerprintFiles, validationPolicy } from './validation.mjs';
import { loadExtension } from './extensions.mjs';

const json = value => JSON.stringify(value,null,2) + '\n';
function listFiles(dir, prefix='') {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? listFiles(path.join(dir,entry.name),prefix+entry.name+'/') : [prefix+entry.name]);
}
export function html({video=false,duration=8}={}) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="An interactive learning activity built from the Marble Skill Taxonomy."><title>Marble Discovery Lab</title><link rel="stylesheet" href="./app.css"></head><body' + (video?' class="video"':'') + '><div data-composition-id="lesson" data-width="1280" data-height="720" data-duration="' + duration + '" data-fps="15"><div id="app" class="app"></div></div><script>window.__timelines=window.__timelines||{};window.__hf=window.__hf||{};window.__hf.buildReady=window.__hf.buildReady||{};window.__hf.buildReady.lesson=new Promise(function(resolve,reject){window.__resolveLessonReady=resolve;window.__rejectLessonReady=reject;});</script><script type="module" src="./app.js"></script></body></html>';
}
export async function bundleArtifact(root) {
  const entry = path.join(root,'source/entry.mjs');
  await build({entryPoints:[entry],outdir:root,entryNames:'app',chunkNames:'chunks/[name]-[hash]',bundle:true,format:'esm',splitting:true,minify:true,target:['chrome120','safari16'],nodePaths:[path.join(packageRoot,'node_modules')],legalComments:'eof',metafile:true});
}
export async function generate(plan, output, {allowPartial=false}={}) {
  const taxonomy = loadTaxonomy();
  if(JSON.stringify(plan.source) !== JSON.stringify(taxonomy.fingerprint)) throw new Error('Taxonomy snapshot changed; create a fresh plan.');
  const {fingerprint,...body} = plan;
  if(hash(JSON.stringify(body)) !== fingerprint) throw new Error('Plan fingerprint mismatch; create a fresh plan.');
  const blocked = plan.lessons.filter(l => l.status !== 'planned');
  if(blocked.length && !allowPartial) {
    const error = new Error('Plan has unresolved topics. Inspect the plan; --allow-partial explicitly builds only independent supported topics.');
    error.details=blocked.map(l=>({topic_id:l.topic_id,status:l.status}));throw error;
  }
  const selected=plan.lessons.filter(l=>l.status==='planned');
  if(!selected.length) throw new Error('No supported, unblocked lessons. Author and verify a domain plugin first.');
  const root=path.resolve(output);
  if(fs.existsSync(root)) throw new Error('Output already exists; use a fresh output directory to preserve accepted artifacts.');
  fs.mkdirSync(path.dirname(root),{recursive:true});
  const staging=root+'.tmp-'+crypto.randomUUID();
  fs.mkdirSync(path.join(staging,'source'),{recursive:true});
  try {
    const extensions=await Promise.all(selected.filter(l=>l.extension).map(async l=>{
      const p=await loadExtension(l.extension.path);
      if(p.extension.sha256!==l.extension.sha256)throw new Error('Extension changed; replan.');
      return p;
    }));
    const lessons=selected.map(l=>{
      const plugin=extensions.find(p=>p.id===l.plugin_id)||catalog.find(p=>p.id===l.plugin_id);
      if(!plugin || plugin.version!==l.plugin_version || !plugin.topicIds.includes(l.topic_id)) throw new Error('Plugin changed; replan.');
      return {...l,title:plugin.title,prompt:plugin.prompt,scenario:plugin.scenario,...(plugin.audienceLabel?{audience_label:plugin.audienceLabel}:{}),...(plugin.extension?{acceptance:plugin.acceptance,presentation_checks:plugin.presentationChecks||[]}:{})};
    });
    const manifest={
      schema_version:'1.0',kind:'learning_artifact',status:blocked.length?'partial_batch':'built',
      source:plan.source,plan_fingerprint:plan.fingerprint,lessons,blocked_topics:blocked,
      graph:plan.graph,requested_outputs:plan.requested_outputs,
      outputs:{interactive_browser:{status:'built',entry:'index.html'},...(plan.requested_outputs.includes('mp4')?{mp4:{status:'not_rendered'}}:{})},
      source_files:{},fingerprints:{generation_request:hash(JSON.stringify({plan:plan.fingerprint,compiler_source:hashTree(path.join(packageRoot,'src')),lockfile:hash(fs.readFileSync(path.join(packageRoot,'package-lock.json'))),policy:validationPolicy})),accepted_source:'',validation_policy:validationPolicy},
      human_review_status:'not_performed',automated_content_checks:'catalog_model_fixtures_required',created_at:new Date().toISOString()
    };
    fs.cpSync(path.join(packageRoot,'src/browser'),path.join(staging,'source/browser'),{recursive:true});
    fs.copyFileSync(path.join(packageRoot,'src/models.mjs'),path.join(staging,'source/models.mjs'));
    if(extensions.length)fs.copyFileSync(extensions[0].extension.path,path.join(staging,'source/extension.mjs'));
    for(const plugin of extensions)for(const asset of plugin.assetFiles||[]){
      const target=path.join(staging,asset.target);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(asset.path,target);
    }
    fs.writeFileSync(path.join(staging,'source/lesson.json'),json({lessons}));
    fs.writeFileSync(path.join(staging,'source/entry.mjs'),'import manifest from "./lesson.json";\nimport {boot} from "./browser/app.mjs";\n'+(extensions.length?'import {plugin} from "./extension.mjs";\n':'')+'boot(manifest'+(extensions.length?',plugin':'')+').then(()=>window.__resolveLessonReady?.()).catch(error=>{document.getElementById("app").textContent="Lesson could not start: "+error.message;window.__rejectLessonReady?.(error);console.error(error);});\n');
    fs.writeFileSync(path.join(staging,'plan.json'),json(plan));
    fs.writeFileSync(path.join(staging,'index.html'),html());
    fs.writeFileSync(path.join(staging,'scenario.json'),json({duration:8,lessons:lessons.map(l=>({topic_id:l.topic_id,events:l.scenario}))}));
    fs.writeFileSync(path.join(staging,'provenance.json'),json({taxonomy:plan.source,topics:lessons.map(l=>({id:l.topic_id,standard_keys:l.standards,coverage:l.coverage,reference_links:l.sources,source_review_status:'links_provided_not_expert_reviewed'})),assets:extensions.flatMap(p=>p.assetFiles||[]),content_license:'CC-BY-SA-4.0 for copied/adapted Marble text',database_license:'ODbL-1.0',code_license:'Follow the fork and dependency licenses; this manifest does not relicense third-party code.',learner_data:'Not transmitted or persisted. Activity state lives in the browser session.'}));
    fs.writeFileSync(path.join(staging,'ATTRIBUTION.md'),'# Attribution\n\nMarble Skill Taxonomy (v1), Generative Spark, Inc. (Marble), https://withmarble.com. Database licensed under ODbL 1.0; Marble-authored text under CC BY-SA 4.0. Topic evidence and assessment prompts are copied or adapted. Preserve these credits and the applicable share-alike terms when distributing that content.\n\nCurriculum standards retain their upstream terms. This artifact includes standard identifiers, not reconstructed restricted full text. See the source repository PROVENANCE.md (included below).\n\n'+fs.readFileSync(path.join(taxonomy.root,'PROVENANCE.md'),'utf8'));
    fs.copyFileSync(path.join(taxonomy.root,'LICENSE-CONTENT'),path.join(staging,'LICENSE-CONTENT'));
    fs.copyFileSync(path.join(taxonomy.root,'LICENSE'),path.join(staging,'LICENSE-DATABASE'));
    fs.mkdirSync(path.join(staging,'licenses'),{recursive:true});
    fs.copyFileSync(path.join(packageRoot,'node_modules/three/LICENSE'),path.join(staging,'licenses/THREE-LICENSE'));
    fs.writeFileSync(path.join(staging,'licenses/THIRD-PARTY.md'),'# Runtime dependencies\n\nThree.js 0.186.1: MIT, copyright notices and full license in THREE-LICENSE.\n\nGSAP 3.15.0: Standard no-charge license, https://gsap.com/standard-license. GSAP copyright/license notices are retained in the bundled JavaScript. The MIT license of the separate gsap-skills repository does not relicense GSAP.\n\nHyperFrames 0.8.171 is an Apache-2.0 licensed build/export tool. Its runtime is used by the video pipeline; the output MP4 does not contain the authoring tool source. Follow upstream terms when distributing tooling.\n');
    fs.writeFileSync(path.join(staging,'BUILD.md'),'# Rebuilding\n\nThis artifact plays from a static HTTP server without CDN requests. Editable modules are in source/. From the compiler checkout, run node cli.mjs rebuild --dir <this-directory> and then node cli.mjs verify --dir <this-directory>. The compiler package-lock.json pins dependencies. Rebuilding invalidates previous validation. Do not claim edited content has been expert reviewed.\n');
    await bundleArtifact(staging);
    const files=listFiles(staging).filter(f=>f!=='manifest.json');
    manifest.source_files=fingerprintFiles(staging,files);
    manifest.fingerprints.accepted_source=hash(JSON.stringify(manifest.source_files));
    validateManifest(manifest);
    fs.writeFileSync(path.join(staging,'manifest.json'),json(manifest));
    fs.renameSync(staging,root);
    return {directory:root,status:manifest.status,topics:lessons.map(l=>l.topic_id),blocked_topics:blocked.map(l=>({topic_id:l.topic_id,status:l.status}))};
  } catch(error) {fs.rmSync(staging,{recursive:true,force:true});throw error;}
}
export async function rebuild(root) {
  const manifest=validateManifest(JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))));
  if(JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,'source/lesson.json'))).lessons)!==JSON.stringify(manifest.lessons))throw new Error('Lesson metadata diverged from its manifest. Generate a fresh plan instead of silently changing evidence claims.');
  await bundleArtifact(root);
  const files=listFiles(root).filter(f=>f!=='manifest.json'&&!f.startsWith('checks/')&&!f.startsWith('exports/'));
  manifest.source_files=fingerprintFiles(root,files);
  manifest.fingerprints.accepted_source=hash(JSON.stringify(manifest.source_files));
  manifest.outputs.interactive_browser={status:'built',entry:'index.html'};
  if(manifest.outputs.mp4)manifest.outputs.mp4.status='stale';
  manifest.status=manifest.blocked_topics?.length?'partial_batch':'built';
  delete manifest.validation;
  fs.writeFileSync(path.join(root,'manifest.json'),json(manifest));return manifest;
}
