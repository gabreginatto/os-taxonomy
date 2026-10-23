import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hostingRoot,readProject,json,readJson} from './catalog.mjs';
import {buildHosting} from './build.mjs';
import {verifyPublic} from './verify-public.mjs';

const cli=path.join(hostingRoot,'node_modules/firebase-tools/lib/bin/firebase.js');
function redact(value){
  let text=String(value);
  if(process.env.FIREBASE_TOKEN)text=text.split(process.env.FIREBASE_TOKEN).join('[REDACTED]');
  return text.replace(/(?:1\/\/|ya29\.|gh[pousr]_)[A-Za-z0-9_./+\-=]+/g,'[REDACTED]');
}
export async function runFirebase(args,root=hostingRoot){
  if(!fs.existsSync(cli))throw Error('Run npm ci in learning-artifacts/hosting first.');
  const result=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[cli,...args,'--json','--non-interactive'],{cwd:root,env:{...process.env,CI:'true',FIREBASE_CLI_DISABLE_TELEMETRY:'true'},stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);child.on('error',reject);child.on('close',code=>resolve({code,stdout,stderr}));
  });
  let response;try{response=JSON.parse(result.stdout.trim());}catch{throw Error(redact(result.stderr||result.stdout||'Firebase CLI returned no JSON.'));}
  if(result.code!==0||response.status!=='success')throw Error(redact(response.error||result.stderr||'Firebase command failed.'));
  return response.result;
}
function stateFile(root){return path.join(root,'.state/project.json');}
function saveState(root,value){fs.mkdirSync(path.dirname(stateFile(root)),{recursive:true});fs.writeFileSync(stateFile(root),json(value));}
function localState(root,config){
  if(!fs.existsSync(stateFile(root)))return null;
  const state=readJson(stateFile(root));
  if(state.projectId!==config.projectId||state.siteId!==config.siteId)throw Error('Local project receipt does not match the configured education project.');
  return state;
}
async function siteFor(config,root,run){
  const result=await run(['hosting:sites:list','--project',config.projectId],root);
  const site=(result.sites||[]).find(s=>s.name.split('/').at(-1)===config.siteId);
  if(site&&site.defaultUrl!=='https://'+config.siteId+'.web.app')throw Error('Hosting returned an unexpected site URL.');
  return site;
}
export async function workflow(command,{root=hostingRoot,run=runFirebase,verify=verifyPublic}={}){
  const config=readProject(root);
  if(command==='plan')return {status:'planned_not_created',project_id:config.projectId,site_id:config.siteId,proposed_home:'https://'+config.siteId+'.web.app/',commands:['npm run check','npm run provision','npm run deploy'],billing:'No billing link, Functions, Firestore or paid services are configured.'};
  if(!['check','connect','provision','deploy','preview'].includes(command))throw Error('Use plan, check, provision, connect, deploy or preview.');
  // This read must work before any cloud mutation. It uses existing CLI/ADC auth.
  const projects=await run(['projects:list'],root);
  if(!Array.isArray(projects))throw Error('Unexpected Firebase project-list response.');
  const existing=projects.find(p=>p.projectId===config.projectId);let receipt=localState(root,config);
  if(command==='check')return {status:'authenticated',project_id:config.projectId,project_exists:!!existing,project_creation_permission:'not_tested',hosting_site:existing?await siteFor(config,root,run):null};
  if(command==='connect'){
    if(!existing)throw Error('Create the separate education project first, then connect it.');
    const site=await siteFor(config,root,run);if(!site)throw Error('The education project does not have its configured Hosting site.');
    receipt={projectId:config.projectId,siteId:config.siteId,projectNumber:existing.projectNumber,origin:'explicit_connect',state:'ready',checked_at:new Date().toISOString()};saveState(root,receipt);
    return {status:'connected_existing_education_project',project_id:config.projectId,url:site.defaultUrl};
  }
  if(command==='provision'){
    if(existing&&!receipt)throw Error('That project ID already exists. To create a new project choose a fresh ID; use connect only for a separately created education project.');
    if(!existing){
      const created=await run(['projects:create',config.projectId,'--display-name',config.displayName],root);
      if(created.projectId!==config.projectId)throw Error('Created project differs from the requested education project.');
      receipt={projectId:config.projectId,siteId:config.siteId,projectNumber:created.projectNumber,origin:'created_by_this_workflow',state:'project_created',created_at:new Date().toISOString()};saveState(root,receipt);
    }
    let site=await siteFor(config,root,run);
    if(!site)site=await run(['hosting:sites:create',config.siteId,'--project',config.projectId],root);
    if(site.defaultUrl!=='https://'+config.siteId+'.web.app')throw Error('Created site URL does not match the education site.');
    receipt={...receipt,state:'ready',checked_at:new Date().toISOString()};saveState(root,receipt);
    return {status:'education_project_ready',project_id:config.projectId,site_id:config.siteId,url:site.defaultUrl,deployed:false};
  }
  if(!existing||receipt?.state!=='ready')throw Error('Provision the separate education project first (or explicitly connect a separately created education project).');
  const site=await siteFor(config,root,run);if(!site)throw Error('Configured site is missing from the education project.');
  const build=buildHosting(root);
  const args=command==='preview'?['hosting:channel:deploy','review','--expires','7d','--no-authorized-domains']:['deploy','--only','hosting'];
  const result=await run([...args,'--project',config.projectId,'--config',path.join(root,'firebase.json')],root);
  const url=command==='preview'?result?.[config.siteId]?.url:site.defaultUrl;
  if(!url)throw Error('Firebase did not return an education Hosting URL.');
  const endpoint=new URL(url),expectedHost=command==='preview'?endpoint.hostname.startsWith(config.siteId+'--')&&endpoint.hostname.endsWith('.web.app'):endpoint.hostname===config.siteId+'.web.app';
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||!expectedHost)throw Error('Firebase did not return an expected education Hosting URL.');
  const publication={status:'deployed_pending_public_verification',project_id:config.projectId,url,activities:build.activities,deployed_at:new Date().toISOString()};
  fs.writeFileSync(path.join(root,'.state/last-deploy.json'),json(publication));
  try{
    publication.verification=await verify(url,root);publication.status='published_and_verified';
  }catch(error){
    publication.verification={status:'failed',error:redact(error.message)};fs.writeFileSync(path.join(root,'.state/last-deploy.json'),json(publication));
    const failure=Error('Firebase accepted the deployment, but public verification failed: '+redact(error.message));failure.deployed=true;failure.url=url;throw failure;
  }
  fs.writeFileSync(path.join(root,'.state/last-deploy.json'),json(publication));return publication;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==3)throw Error('Pass exactly one command; project selection is controlled by project.json.');
  try{console.log(json(await workflow(process.argv[2])));}catch(error){console.error(json({status:error.deployed?'deployed_public_verification_failed':'blocked',error:redact(error.message),deployed:!!error.deployed,...(error.url?{url:error.url}:{})}));process.exitCode=1;}
}
