import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { hash } from './taxonomy.mjs';
import { applyChecked } from './models.mjs';

export async function loadExtension(filename,{artifactRoot=null}={}) {
  const file=path.resolve(filename), sha256=hash(fs.readFileSync(file));
  const {plugin}=await import(pathToFileURL(file).href+'?hash='+sha256);
  if(!plugin||typeof plugin!=='object')throw new Error('Extension must export a plugin object.');
  for(const key of ['initialState','applyAction','observe','validateInvariants','assess','createPresentation'])if(typeof plugin[key]!=='function')throw new Error('Extension missing '+key);
  for(const key of ['id','version','title','prompt'])if(typeof plugin[key]!=='string'||!plugin[key])throw new Error('Extension missing metadata '+key);
  if(!Array.isArray(plugin.topicIds)||plugin.topicIds.length!==1)throw new Error('Each extension currently targets exactly one taxonomy topic.');
  if(!['html_svg','canvas2d','threejs'].includes(plugin.representation))throw new Error('Extension representation is invalid.');
  for(const key of ['coverage','assumptions','sources','scenario','fixtures','acceptance'])if(!Array.isArray(plugin[key])||!plugin[key].length)throw new Error('Extension requires nonempty '+key);
  let previous=-Infinity;
  for(const event of plugin.scenario){
    if(!Number.isFinite(event.time)||event.time<0||event.time<previous||!event.action)throw new Error('Extension scenario needs sorted nonnegative event times and actions.');
    previous=event.time;
  }
  if(!plugin.validateInvariants(plugin.initialState()))throw new Error('Extension initial state violates its invariants.');
  const assets=(plugin.assetFiles||[]).map(asset=>{
    if(!asset.target||path.isAbsolute(asset.target)||asset.target.split(/[\\/]/).includes('..')||!asset.target.startsWith('assets/'))throw new Error('Extension assets must target a safe assets/ path.');
    if(!asset.license||!asset.provenance)throw new Error('Extension asset needs license and provenance.');
    const source=artifactRoot?path.join(artifactRoot,asset.target):path.resolve(path.dirname(file),asset.path);
    if(hash(fs.readFileSync(source))!==asset.sha256)throw new Error('Extension asset checksum mismatch.');
    return {...asset,path:source};
  });
  if(new Set(assets.map(a=>a.target)).size!==assets.length)throw new Error('Duplicate extension asset target.');
  return {...plugin,assetFiles:assets,extension:{path:file,sha256,assets}};
}
export function checkExtensionModel(plugin) {
  const checks=[];
  function check(name,fn){try{fn();checks.push({name,status:'passed'});}catch(error){checks.push({name,status:'failed',error:error.message});}}
  check(plugin.id+': initial invariant and serialization',()=>{
    const state=plugin.initialState();assert.equal(plugin.validateInvariants(state),true);assert.deepEqual(JSON.parse(JSON.stringify(state)),state);
  });
  for(const [i,fixture]of plugin.fixtures.entries())check(plugin.id+': independent fixture '+(i+1),()=>{
    let state=plugin.initialState();
    for(const action of fixture.actions||[])state=applyChecked(plugin,state,action);
    if(!fixture.expectedObservation||!Object.keys(fixture.expectedObservation).length)throw new Error('Fixture needs independent expected observables.');
    const observed=plugin.observe(state);
    for(const [key,value]of Object.entries(fixture.expectedObservation))assert.deepEqual(observed[key],value);
    if(fixture.expectedCorrect!==undefined)assert.equal(plugin.assess(state).correct,fixture.expectedCorrect);
  });
  return checks;
}
