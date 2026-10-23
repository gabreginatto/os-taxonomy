import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateManifest,verifySourceHashes,validationFingerprint} from '../../src/validation.mjs';

export const hostingRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export const json=value=>JSON.stringify(value,null,2)+'\n';
export const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
export const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeRelative(root,name){
  if(typeof name!=='string'||!name||path.isAbsolute(name)||name.split(/[\\/]/).includes('..')||name.includes('\\'))throw Error('Unsafe relative path');
  const file=path.resolve(root,name),real=fs.realpathSync(file),realRoot=fs.realpathSync(root);
  if(!real.startsWith(realRoot+path.sep)||!fs.statSync(real).isFile())throw Error('File escapes its artifact or is not a regular file');
  return real;
}
export function readProject(root=hostingRoot){
  const config=readJson(path.join(root,'project.json'));
  const prohibited=new Set(['html-comerciais-prod','hagin-480221','sabesp-comercial','sabesp-missao-china','demo-planner',...(config.excludedProjects||[])]);
  if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(config.projectId)||prohibited.has(config.projectId)||/^(html-comerciais|sabesp|naiad|hagin|mazu|tubom|kratos)(-|$)/.test(config.projectId))throw Error('Choose a separate education project; existing business projects are prohibited.');
  if(config.siteId!==config.projectId)throw Error('Education site ID must match the dedicated project ID.');
  if(typeof config.displayName!=='string'||!config.displayName.trim())throw Error('Project display name is required.');
  const rc=readJson(path.join(root,'.firebaserc')),firebase=readJson(path.join(root,'firebase.json'));
  if(rc.projects?.education!==config.projectId||Object.values(rc.projects||{}).some(id=>id!==config.projectId))throw Error('Firebase aliases must all point to the separate education project.');
  if(Object.keys(firebase).some(key=>key!=='hosting')||Array.isArray(firebase.hosting)||firebase.hosting?.site!==config.siteId||firebase.hosting.public!=='public'||firebase.hosting.rewrites?.length)throw Error('Only static Hosting for the exact education site is permitted.');
  return config;
}
export function assertArtifactReady(directory){
  const root=path.resolve(directory),manifest=validateManifest(readJson(path.join(root,'manifest.json')));
  if(manifest.status!=='validated'||manifest.blocked_topics?.length||manifest.outputs.interactive_browser.status!=='verified'||manifest.validation?.status!=='passed'||manifest.validation.browser?.status!=='passed')throw Error('Only fully verified artifacts can be published. Run the lesson verifier first.');
  verifySourceHashes(root,manifest);
  if(manifest.validation.validation_fingerprint!==validationFingerprint(manifest,manifest.validation.browser.profile))throw Error('Artifact verification is stale. Reverify with the current checks.');
  for(const filename of ['index.html','app.js','app.css'])if(!manifest.source_files[filename])throw Error('Artifact is missing a required runtime file.');
  return manifest;
}
export function readCatalog(root=hostingRoot){
  const catalog=readJson(path.join(root,'catalog.json')),slugs=new Set();
  if(typeof catalog.title!=='string'||!Array.isArray(catalog.activities)||!catalog.activities.length)throw Error('Catalog needs a title and at least one activity.');
  for(const entry of catalog.activities){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)||['assets','credits','404','index','build-manifest'].includes(entry.slug)||slugs.has(entry.slug))throw Error('Activity slug is unsafe, reserved or duplicated.');
    slugs.add(entry.slug);
    for(const key of ['title','description','audience','artifact'])if(typeof entry[key]!=='string'||!entry[key].trim())throw Error('Activity needs '+key);
    if(!Array.isArray(entry.tags)||entry.tags.some(tag=>typeof tag!=='string'))throw Error('Activity tags must be strings.');
  }
  return catalog;
}
export function publicRuntimeFiles(manifest){
  return Object.keys(manifest.source_files).filter(file=>['index.html','app.js','app.css','ATTRIBUTION.md','LICENSE-CONTENT','LICENSE-DATABASE'].includes(file)||/^(?:chunks|assets|licenses)\//.test(file));
}
