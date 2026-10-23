import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {hash} from '../src/taxonomy.mjs';
import {loadExtension} from '../src/extensions.mjs';
import {validateManifest,verifySourceHashes} from '../src/validation.mjs';
import {readCatalog,assertArtifactReady,safeRelative} from '../hosting/scripts/catalog.mjs';

export async function restorePublished({root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),chromium='/usr/bin/chromium'}={}) {
  const hosting=path.join(root,'hosting'),recipes=JSON.parse(fs.readFileSync(path.join(root,'lessons/published.json'))),results=[];
  const inside=(base,file)=>{const result=path.resolve(base,file);if(!result.startsWith(path.resolve(base)+path.sep))throw Error('Restore path escapes its package: '+file);return result;};
  const run=args=>{const result=spawnSync(process.execPath,[path.join(root,'cli.mjs'),...args],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});if(result.error)throw result.error;if(result.status!==0)throw Error('Restore command failed: '+args[0]+'\n'+(result.stderr||result.stdout).slice(-6000));};
  for(const entry of readCatalog(hosting).activities){
    const recipe=recipes[entry.slug];if(!recipe)throw Error('Missing committed restore recipe for '+entry.slug);
    const plugin=inside(root,recipe.plugin),thumbnail=inside(root,recipe.thumbnail),destination=inside(root,path.relative(root,path.resolve(hosting,entry.artifact)));
    if(!destination.startsWith(path.join(root,'output')+path.sep))throw Error('Restore artifacts must be under output/.');
    if(!Number.isInteger(recipe.age)||recipe.age<=0)throw Error('Restore recipe needs a learner age.');
    const definition=await loadExtension(plugin);
    let status='restored';
    if(fs.existsSync(destination)){
      const manifest=validateManifest(JSON.parse(fs.readFileSync(path.join(destination,'manifest.json'))));
      verifySourceHashes(destination,manifest);
      if(manifest.lessons.length!==1||manifest.lessons[0].extension?.sha256!==hash(fs.readFileSync(plugin))||manifest.lessons[0].age!==recipe.age)throw Error('Existing artifact does not match current source. Preserve it and generate a fresh version: '+entry.slug);
      try{assertArtifactReady(destination);status='reused_verified';}catch{run(['verify','--dir',destination,'--only-browser','--chromium',chromium]);}
    }else{
      // Each published plugin declares exactly one taxonomy foundation.
      run(['generate','--topic',definition.topicIds[0],'--age',String(recipe.age),'--plugin',plugin,'--out',destination]);
      run(['verify','--dir',destination,'--only-browser','--chromium',chromium]);
    }
    assertArtifactReady(destination);
    if(entry.thumbnail){
      if(path.isAbsolute(entry.thumbnail)||entry.thumbnail.split(/[\\/]/).includes('..'))throw Error('Unsafe thumbnail target.');
      const target=inside(destination,entry.thumbnail);
      if(!fs.existsSync(target)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(thumbnail,target);}
      safeRelative(destination,entry.thumbnail);
    }
    results.push({slug:entry.slug,status,artifact:path.relative(root,destination)});
  }
  return {status:'verified_local_artifacts',activities:results,deployed:false};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);if(args.includes('--help')){console.log('Restore and browser-verify the published catalog from committed sources.\nUsage: node scripts/restore-published.mjs [--chromium <executable>]\nExisting matching verified artifacts are reused. No deployment or credentials required.');}
  else{if(args.length&&!(args.length===2&&args[0]==='--chromium'))throw Error('Use --help or --chromium <executable>.');console.log(JSON.stringify(await restorePublished({chromium:args[1]||'/usr/bin/chromium'}),null,2));}
}
