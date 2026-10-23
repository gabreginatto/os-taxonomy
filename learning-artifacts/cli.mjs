#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadTaxonomy, searchTopics, packageRoot, pythonExecutable } from './src/taxonomy.mjs';
import { catalog, forTopic } from './src/catalog.mjs';
import { createPlan } from './src/planner.mjs';
import { generate, rebuild } from './src/generator.mjs';
import { verify, runProcess } from './src/verify.mjs';
import { serveDirectory } from './src/server.mjs';
import { renderVideo } from './src/video.mjs';
import { loadExtension } from './src/extensions.mjs';
import { verifyAsset } from './src/asset-check.mjs';

function parse(argv) {
  const options={topic:[],mastered:[],positional:[]};
  const boolean=new Set(['allow-partial','only-browser','json']);
  const valueFlags=new Set(['topic','mastered','age','format','plan','out','dir','port','host','query','kind','seconds','fps','chromium','plugin','asset']);
  for(let i=0;i<argv.length;i++){
    const token=argv[i];
    if(!token.startsWith('--')){options.positional.push(token);continue;}
    const key=token.slice(2);
    if(boolean.has(key)){options[key]=true;continue;}
    if(!valueFlags.has(key))throw new Error('Unknown option '+token);
    const value=argv[++i];if(value===undefined||value.startsWith('--'))throw new Error('Missing value for '+token);
    if(key==='topic'||key==='mastered')options[key].push(value);else options[key]=value;
  }
  return options;
}
const print=value=>process.stdout.write(JSON.stringify(value,null,2)+'\n');
const required=(options,key)=>{if(!options[key])throw new Error('Missing --'+key);return options[key];};
function doctor() {
  const commands={};
  for(const command of ['node','npm','python3','blender','chromium','ffmpeg']){
    const r=spawnSync('which',[command],{encoding:'utf8'});commands[command]={available:r.status===0,path:r.status===0?r.stdout.trim():null};
  }
  const python=spawnSync(pythonExecutable,['-c','import playwright; print("available")'],{encoding:'utf8'});
  return {commands,playwright:{available:python.status===0},catalog:catalog.map(p=>({id:p.id,topics:p.topicIds,representation:p.representation})),mcp:{blender:'not_configured_or_probed'},note:'Availability report. Generate and verify an artifact to establish working integration.'};
}
export async function main(argv=process.argv.slice(2)) {
  const command=argv[0]||'help',o=parse(argv.slice(1));
  if(command==='help'){print({usage:'node learning-artifacts/cli.mjs <command> [options]',commands:{doctor:'Report local tools and catalog',search:'--query <text>',plan:'--topic <ID/name> [--topic ...] [--age 8] [--format interactive_browser,mp4] [--out plan.json]',generate:'--topic <ID/name> OR --plan plan.json --out <fresh-directory> [--allow-partial] [--plugin file.plugin.mjs]',verify:'--dir <artifact> [--only-browser]',serve:'--dir <artifact> [--port 4173]',video:'--dir <verified-single-lesson-artifact> [--seconds 8] [--fps 15]',rebuild:'--dir <artifact>; invalidates old validation',asset:'--kind cube|sphere|drum --out <fresh-file.glb>','verify-asset':'--dir <threejs-artifact> --asset <file.glb> --out <report.json>'}});return;}
  if(command==='doctor'){print(doctor());return;}
  if(command==='search'){const t=loadTaxonomy();print(searchTopics(t,o.query||o.positional.join(' ')).map(topic=>({id:topic.id,name:topic.name,subject:topic.subject,age:[topic.ageRangeStart,topic.ageRangeEnd],plugin:forTopic(topic.id)?.id||null})));return;}
  if(command==='plan'||command==='generate'){
    const plugins=o.plugin?[await loadExtension(o.plugin)]:[];
    const plan=o.plan?JSON.parse(fs.readFileSync(o.plan)):createPlan({topics:o.topic,age:o.age===undefined?undefined:Number(o.age),outputs:o.format?o.format.split(','):['interactive_browser'],mastered:o.mastered,plugins});
    if(command==='plan'){if(o.out){if(fs.existsSync(o.out))throw new Error('Plan output already exists.');fs.mkdirSync(path.dirname(path.resolve(o.out)),{recursive:true});fs.writeFileSync(o.out,JSON.stringify(plan,null,2)+'\n');}print(plan);return;}
    print(await generate(plan,required(o,'out'),{allowPartial:Boolean(o['allow-partial'])}));return;
  }
  if(command==='verify'){const report=await verify(required(o,'dir'),{onlyBrowser:Boolean(o['only-browser']),chromium:o.chromium||'/usr/bin/chromium'});print(report);if(report.status!=='passed')process.exitCode=1;return;}
  if(command==='rebuild'){const manifest=await rebuild(path.resolve(required(o,'dir')));print({status:manifest.status,source_fingerprint:manifest.fingerprints.accepted_source});return;}
  if(command==='video'){print(await renderVideo(required(o,'dir'),{seconds:Number(o.seconds||8),fps:Number(o.fps||15),chromium:o.chromium||'/usr/bin/chromium'}));return;}
  if(command==='verify-asset'){print(await verifyAsset(required(o,'dir'),required(o,'asset'),required(o,'out')));return;}
  if(command==='serve'){const service=await serveDirectory(required(o,'dir'),Number(o.port||4173),o.host||'127.0.0.1');print({status:'serving',port:service.port,scope:'local_development_only'});for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await service.close();process.exit(0);});return;}
  if(command==='asset'){
    const output=path.resolve(required(o,'out'));if(!output.endsWith('.glb'))throw new Error('Asset output must end in .glb');
    const result=await runProcess('blender',['--background','--factory-startup','--threads','2','--python-exit-code','1','--python',path.join(packageRoot,'scripts/blender_asset.py'),'--','--kind',o.kind||'cube','--out',output],{timeout:120000});
    if(result.code!==0)throw new Error('Blender export failed: '+result.stderr+'\n'+result.stdout);
    print({status:'exported',path:output,bytes:fs.statSync(output).size,compression:'none',browser_asset_loading:'not_yet_verified'});return;
  }
  throw new Error('Unknown command '+command);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{print({status:'error',error:error.message,code:error.code||null,candidates:error.candidates||undefined,details:error.details||undefined});process.exitCode=1;});
}
