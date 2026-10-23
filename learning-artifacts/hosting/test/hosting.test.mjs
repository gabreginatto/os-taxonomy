import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {hostingRoot,readProject,readCatalog,readJson,json,assertArtifactReady} from '../scripts/catalog.mjs';
import {buildHosting} from '../scripts/build.mjs';
import {workflow} from '../scripts/firebase.mjs';
import {createPlan} from '../../src/planner.mjs';
import {generate} from '../../src/generator.mjs';
import {verify} from '../../src/verify.mjs';

let temp,artifact;
before(async()=>{
  temp=fs.mkdtempSync(path.join(os.tmpdir(),'learning-hosting-tests-'));artifact=path.join(temp,'verified-fraction');
  await generate(createPlan({topics:['mt_FbDKeLfBCo'],age:10}),artifact);
  const result=await verify(artifact);assert.equal(result.status,'passed','A real browser-verified compiler fixture is required.');
});
after(()=>fs.rmSync(temp,{recursive:true,force:true}));
function fixture(name){
  const root=path.join(temp,name);fs.mkdirSync(root);
  for(const file of ['project.json','.firebaserc','firebase.json'])fs.copyFileSync(path.join(hostingRoot,file),path.join(root,file));
  fs.writeFileSync(path.join(root,'catalog.json'),json({title:'Test Lab',activities:[{slug:'fractions',title:'Fractions',description:'Compare equal parts.',audience:'Age 10',tags:['Math'],artifact}]}));return root;
}
test('business project IDs and mismatched hosting targets are rejected before any cloud call',async()=>{
  const root=fixture('project-guards'),config=readJson(path.join(root,'project.json'));
  for(const id of ['html-comerciais-prod','sabesp-missao-china','hagin-480221','demo-planner']){
    fs.writeFileSync(path.join(root,'project.json'),json({...config,projectId:id,siteId:id}));
    await assert.rejects(workflow('provision',{root,run:()=>{throw Error('Cloud was called before validation.');}}),/separate education/);
  }
  fs.writeFileSync(path.join(root,'project.json'),json(config));
  const firebase=readJson(path.join(root,'firebase.json'));firebase.hosting.site='html-comerciais-prod';fs.writeFileSync(path.join(root,'firebase.json'),json(firebase));
  assert.throws(()=>readProject(root),/exact education site/);
});
test('catalog rejects traversal, reserved paths, and duplicate routes',()=>{
  const root=fixture('catalog-guards'),base=readJson(path.join(root,'catalog.json'));
  for(const slug of ['../private','assets','a/b']){
    fs.writeFileSync(path.join(root,'catalog.json'),json({...base,activities:[{...base.activities[0],slug}]}));assert.throws(()=>readCatalog(root),/slug/);
  }
  fs.writeFileSync(path.join(root,'catalog.json'),json({...base,activities:[base.activities[0],base.activities[0]]}));assert.throws(()=>readCatalog(root),/duplicated/);
});
test('only verified unchanged artifacts are accepted; pending and modified files are rejected',()=>{
  assert.equal(assertArtifactReady(artifact).status,'validated');
  const copy=path.join(temp,'tampered');fs.cpSync(artifact,copy,{recursive:true});
  const manifest=readJson(path.join(copy,'manifest.json'));manifest.status='built';fs.writeFileSync(path.join(copy,'manifest.json'),json(manifest));
  assert.throws(()=>assertArtifactReady(copy),/fully verified/);
  manifest.status='validated';fs.writeFileSync(path.join(copy,'manifest.json'),json(manifest));fs.appendFileSync(path.join(copy,'app.js'),'\n// edited after verification');
  assert.throws(()=>assertArtifactReady(copy),/changed since generation/);
});
test('build exports executable runtime and credits, excludes editable/secret files, and rebuilds reproducibly',()=>{
  const root=fixture('build'),first=buildHosting(root),publicDir=path.join(root,'public');
  assert.equal(first.status,'built_locally_not_deployed');
  for(const file of ['index.html','app.js','app.css','ATTRIBUTION.md','LICENSE-CONTENT'])assert.ok(fs.existsSync(path.join(publicDir,'fractions',file)));
  for(const file of ['source','plan.json','manifest.json','checks','project.json','.firebaserc'])assert.equal(fs.existsSync(path.join(publicDir,'fractions',file)),false);
  assert.ok(fs.readFileSync(path.join(publicDir,'index.html'),'utf8').includes('href="fractions/"'));
  const before=readJson(path.join(publicDir,'build-manifest.json')).files;buildHosting(root);
  assert.deepEqual(readJson(path.join(publicDir,'build-manifest.json')).files,before);
  fs.writeFileSync(path.join(publicDir,'build-manifest.json'),json({kind:'user_files'}));assert.throws(()=>buildHosting(root),/unknown public directory/);
});
test('project creation is explicit, records the new education project, and scopes Hosting creation correctly',async()=>{
  const root=fixture('provision'),config=readProject(root),calls=[];
  const run=async args=>{calls.push(args);if(args[0]==='projects:list')return [];if(args[0]==='projects:create')return {projectId:config.projectId,projectNumber:'123456'};if(args[0]==='hosting:sites:list')return {sites:[]};if(args[0]==='hosting:sites:create')return {name:'projects/'+config.projectId+'/sites/'+config.siteId,defaultUrl:'https://'+config.siteId+'.web.app'};throw Error('Unexpected command');};
  const result=await workflow('provision',{root,run});assert.equal(result.status,'education_project_ready');assert.equal(result.deployed,false);
  assert.deepEqual(calls.find(a=>a[0]==='projects:create'),['projects:create',config.projectId,'--display-name',config.displayName]);
  assert.ok(calls.filter(a=>a[0].startsWith('hosting:')).every(a=>a[a.indexOf('--project')+1]===config.projectId));
  assert.equal(readJson(path.join(root,'.state/project.json')).state,'ready');
});
test('existing IDs are not silently reused; missing authentication stops all mutations',async()=>{
  const root=fixture('no-reuse'),config=readProject(root),calls=[];
  await assert.rejects(workflow('provision',{root,run:async args=>{calls.push(args);return [{projectId:config.projectId}];}}),/already exists/);
  assert.deepEqual(calls,[['projects:list']]);
  await assert.rejects(workflow('deploy',{root,run:async()=>{throw Error('Failed to authenticate');}}),/authenticate/);
  assert.equal(fs.existsSync(path.join(root,'public')),false);
});
test('deployment uses only the separate project and cannot claim success when public verification fails',async()=>{
  const root=fixture('deployment'),config=readProject(root),calls=[];
  fs.mkdirSync(path.join(root,'.state'));fs.writeFileSync(path.join(root,'.state/project.json'),json({projectId:config.projectId,siteId:config.siteId,state:'ready'}));
  const run=async args=>{calls.push(args);if(args[0]==='projects:list')return [{projectId:config.projectId}];if(args[0]==='hosting:sites:list')return {sites:[{name:'projects/'+config.projectId+'/sites/'+config.siteId,defaultUrl:'https://'+config.siteId+'.web.app'}]};if(args[0]==='deploy')return {hosting:'test-version'};throw Error('Unexpected command');};
  await assert.rejects(workflow('deploy',{root,run,verify:async()=>{throw Error('HTTP 403');}}),error=>error.deployed===true&&error.message.includes('public verification failed'));
  const deployment=calls.find(a=>a[0]==='deploy');assert.equal(deployment[deployment.indexOf('--project')+1],config.projectId);assert.deepEqual(deployment.slice(0,3),['deploy','--only','hosting']);
  const receipt=readJson(path.join(root,'.state/last-deploy.json'));assert.equal(receipt.status,'deployed_pending_public_verification');assert.equal(receipt.verification.status,'failed');
});
