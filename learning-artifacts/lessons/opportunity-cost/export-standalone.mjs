// Package a verified lesson for opening directly from disk, without a server.
// Restricted to this asset-free extension; extensions with external assets need the normal folder.
import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {verifySourceHashes} from '../../src/validation.mjs';
const [artifactArg,outputArg]=process.argv.slice(2);
if(!artifactArg||!outputArg)throw new Error('Usage: node lessons/opportunity-cost/export-standalone.mjs <verified-artifact-dir> <fresh-output.html>');
const root=path.resolve(artifactArg),out=path.resolve(outputArg);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
if(manifest.status!=='validated'||manifest.lessons.length!==1||manifest.lessons[0].plugin_id!=='opportunity-cost-lab'||manifest.lessons[0].extension.assets.length)throw new Error('Expected a verified, asset-free Opportunity Cost Lab artifact.');
verifySourceHashes(root,manifest);
if(fs.existsSync(out))throw new Error('Output exists; use a fresh filename.');
const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const result=await build({entryPoints:[path.join(root,'source/entry.mjs')],outfile:'app.js',bundle:true,format:'iife',minify:true,write:false,nodePaths:[path.join(packageRoot,'node_modules')],target:['chrome120','safari16'],legalComments:'inline'});
const js=result.outputFiles.find(f=>f.path.endsWith('.js')).text;
const css=result.outputFiles.find(f=>f.path.endsWith('.css')).text;
const provenance=JSON.stringify({manifest,provenance:JSON.parse(fs.readFileSync(path.join(root,'provenance.json'))),attribution:fs.readFileSync(path.join(root,'ATTRIBUTION.md'),'utf8'),content_license:fs.readFileSync(path.join(root,'LICENSE-CONTENT'),'utf8'),database_license:fs.readFileSync(path.join(root,'LICENSE-DATABASE'),'utf8'),third_party:fs.readFileSync(path.join(root,'licenses/THIRD-PARTY.md'),'utf8'),three_license:fs.readFileSync(path.join(root,'licenses/THREE-LICENSE'),'utf8')}).replaceAll('<','\\u003c');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
  .replace('<title>Marble Discovery Lab</title>','<title>Choice Islands · Opportunity Cost</title>')
  .replace('<link rel="stylesheet" href="./app.css">','<style>'+css.replaceAll('</style','<\\/style')+'</style>')
  .replace('<script type="module" src="./app.js"></script>',()=>'<script type="application/json" id="artifact-provenance">'+provenance+'</script><script>'+js.replaceAll('</script','<\\/script')+'</script>');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html);
console.log(JSON.stringify({file:out,bytes:fs.statSync(out).size,source_fingerprint:manifest.fingerprints.accepted_source}));
