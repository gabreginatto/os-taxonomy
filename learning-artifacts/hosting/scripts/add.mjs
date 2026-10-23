import fs from 'node:fs';
import path from 'node:path';
import {hostingRoot,readCatalog,assertArtifactReady,json} from './catalog.mjs';
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){if(!args[i]?.startsWith('--')||!args[i+1])throw Error('Use --artifact <dir> --slug <name> [--title <title>] [--description <text>] [--thumbnail <relative-file>]');options[args[i].slice(2)]=args[i+1];}
if(!options.artifact||!options.slug)throw Error('--artifact and --slug are required.');
const directory=path.resolve(options.artifact),manifest=assertArtifactReady(directory),catalog=readCatalog();
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.slug)||['assets','credits','404','index','build-manifest'].includes(options.slug))throw Error('Invalid or reserved slug.');
if(catalog.activities.some(a=>a.slug===options.slug))throw Error('Slug exists. Edit its catalog entry intentionally to publish a new version.');
const lesson=manifest.lessons[0];
catalog.activities.push({slug:options.slug,title:options.title||lesson.title,description:options.description||lesson.prompt,audience:lesson.audience_label||'Age '+lesson.age,tags:[lesson.subject,...new Set(manifest.lessons.map(l=>l.route.representation==='threejs'?'3D':'Interactive'))],artifact:path.relative(hostingRoot,directory),...(options.thumbnail?{thumbnail:options.thumbnail}:{})});
fs.writeFileSync(path.join(hostingRoot,'catalog.json'),json(catalog));
console.log(json({status:'registered_not_deployed',slug:options.slug,path:'/'+options.slug+'/'}));
