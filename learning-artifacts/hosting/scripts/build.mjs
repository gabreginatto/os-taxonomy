import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {hostingRoot,readProject,readCatalog,assertArtifactReady,publicRuntimeFiles,safeRelative,escapeHtml as e,sha,json,readJson} from './catalog.mjs';

export function buildHosting(root=hostingRoot){
  const project=readProject(root),catalog=readCatalog(root),output=path.join(root,'public');
  if(fs.existsSync(output)&&(!fs.existsSync(path.join(output,'build-manifest.json'))||readJson(path.join(output,'build-manifest.json')).kind!=='family_learning_hosting'))throw Error('Refusing to replace an unknown public directory.');
  const staging=output+'.tmp-'+crypto.randomUUID();fs.mkdirSync(path.join(staging,'assets'),{recursive:true});
  const activities=[];
  try{
    for(const entry of catalog.activities){
      const artifact=path.resolve(root,entry.artifact),manifest=assertArtifactReady(artifact),target=path.join(staging,entry.slug);
      fs.mkdirSync(target,{recursive:true});
      for(const name of publicRuntimeFiles(manifest)){
        const source=safeRelative(artifact,name),dest=path.join(target,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);
      }
      let thumbnail=null;
      if(entry.thumbnail){
        if(!/\.(png|webp|jpe?g)$/.test(entry.thumbnail))throw Error('Thumbnails must be raster screenshots.');
        const source=safeRelative(artifact,entry.thumbnail);thumbnail='assets/'+entry.slug+path.extname(entry.thumbnail);fs.copyFileSync(source,path.join(staging,thumbnail));
      }
      activities.push({...entry,artifact:undefined,thumbnail,href:entry.slug+'/',topic_ids:manifest.lessons.map(l=>l.topic_id),renderers:manifest.lessons.map(l=>l.route.representation),source_fingerprint:manifest.fingerprints.accepted_source});
    }
    fs.writeFileSync(path.join(staging,'index.html'),portal(catalog.title,activities));
    fs.writeFileSync(path.join(staging,'404.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Find your next world</title><body style="background:#18182b;color:#faf8ff;font:20px system-ui;padding:10vw"><h1>This world is still being explored.</h1><p><a style="color:#c7ff79" href="/">Back to the Learning Lab →</a></p></body></html>');
    fs.writeFileSync(path.join(staging,'favicon.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#18182b"/><circle cx="32" cy="32" r="23" fill="#c7ff79"/><path d="M32 15l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="#28233d"/></svg>');
    fs.writeFileSync(path.join(staging,'favicon.ico'),faviconIco());
    fs.writeFileSync(path.join(staging,'robots.txt'),'User-agent: *\nAllow: /\n');
    fs.writeFileSync(path.join(staging,'credits.html'),credits(activities));
    const files={};
    function collect(dir,prefix=''){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const name=prefix+item.name;if(item.isDirectory())collect(path.join(dir,item.name),name+'/');else files[name]=sha(fs.readFileSync(path.join(dir,item.name)));}}
    collect(staging);
    const result={kind:'family_learning_hosting',schema_version:'1.0',project_id:project.projectId,site_id:project.siteId,built_at:new Date().toISOString(),activities,files};
    fs.writeFileSync(path.join(staging,'build-manifest.json'),json(result));
    const backup=output+'.previous-'+crypto.randomUUID();
    if(fs.existsSync(output))fs.renameSync(output,backup);
    try{fs.renameSync(staging,output);}catch(error){if(fs.existsSync(backup))fs.renameSync(backup,output);throw error;}
    fs.rmSync(backup,{recursive:true,force:true});
    return {directory:output,activities:activities.map(a=>({slug:a.slug,path:'/'+a.href,title:a.title})),files:Object.keys(files).length,status:'built_locally_not_deployed'};
  }catch(error){fs.rmSync(staging,{recursive:true,force:true});throw error;}
}
function faviconIco(){
  const pixels=Buffer.alloc(16*16*4),mask=Buffer.alloc(16*4);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const inCircle=(x-7.5)**2+(y-7.5)**2<43,star=Math.abs(x-7.5)+Math.abs(y-7.5)<4;const c=inCircle&&!star?[199,255,121]:[24,24,43],offset=((15-y)*16+x)*4;pixels.set([c[2],c[1],c[0],255],offset);}
  const bmp=Buffer.alloc(40);bmp.writeUInt32LE(40,0);bmp.writeInt32LE(16,4);bmp.writeInt32LE(32,8);bmp.writeUInt16LE(1,12);bmp.writeUInt16LE(32,14);bmp.writeUInt32LE(pixels.length+mask.length,20);
  const head=Buffer.alloc(22);head.writeUInt16LE(1,2);head.writeUInt16LE(1,4);head[6]=head[7]=16;head.writeUInt16LE(1,10);head.writeUInt16LE(32,12);head.writeUInt32LE(bmp.length+pixels.length+mask.length,14);head.writeUInt32LE(22,18);return Buffer.concat([head,bmp,pixels,mask]);
}
function portal(title,activities){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><meta name="description" content="Interactive worlds for curious minds. Explore mental models through playful experiments."><link rel="icon" href="favicon.svg" type="image/svg+xml"><style>
*{box-sizing:border-box}body{margin:0;background:#18182b;color:#faf8ff;font-family:ui-rounded,"Avenir Next",system-ui,sans-serif}a{color:inherit;text-decoration:none}a:focus-visible{outline:3px solid #c7ff79;outline-offset:6px}main{max-width:1220px;margin:auto;padding:32px 38px}.brand{display:flex;gap:10px;align-items:center;font-size:12px;letter-spacing:.12em;font-weight:800}.brand i{font-style:normal;width:31px;height:31px;border-radius:50%;background:#c7ff79;color:#28233d;display:grid;place-items:center;font-size:20px}.eyebrow{font-size:12px;color:#baa1e6;letter-spacing:.14em;font-weight:800;margin:64px 0 18px}h1{font-size:clamp(43px,7vw,80px);line-height:1.03;letter-spacing:-.055em;margin:0;max-width:850px}h1 span{color:#c7ff79}.intro{font-size:18px;line-height:1.7;color:#bfb2d4;max-width:600px;margin:22px 0 45px}.worlds{display:grid;gap:25px}.world{border:1px solid #625078;border-radius:25px;overflow:hidden;background:#262039;display:grid;grid-template-columns:1.4fr 1fr;transition:transform .2s,border-color .2s}.world:hover{transform:translateY(-4px);border-color:#c7ff79}.world img{display:block;width:100%;height:100%;object-fit:cover;min-height:280px;background:#b7a1f5}.copy{padding:32px;display:flex;flex-direction:column;justify-content:center}.tags{display:flex;gap:6px;flex-wrap:wrap}.tag{border:1px solid #6e5886;color:#d4b8f5;font-size:10px;padding:5px 9px;border-radius:15px}.world h2{font-size:35px;letter-spacing:-.04em;line-height:1.15;margin:19px 0 12px}.world p{font-size:14px;line-height:1.65;color:#bcaacc;margin:0 0 18px}.audience{font-size:11px;color:#d6c6eb}.launch{display:inline-flex;align-self:start;align-items:center;gap:27px;background:#c7ff79;color:#25331c;padding:14px 21px;border-radius:24px;font-size:13px;font-weight:800;margin-top:25px;min-height:48px}.footer{display:flex;justify-content:space-between;gap:15px;margin:45px 0 5px;padding-top:23px;border-top:1px solid #3c304e;font-size:11px;color:#9d8bae}.footer a{text-decoration:underline}@media(max-width:750px){main{padding:24px 18px}.eyebrow{margin-top:43px}h1{font-size:49px}.intro{font-size:16px;margin:20px 0 30px}.world{grid-template-columns:1fr}.world img{height:auto;min-height:0}.copy{padding:24px}.world h2{font-size:31px}.launch{width:100%;justify-content:space-between}.footer{flex-direction:column;line-height:1.7}}@media(prefers-reduced-motion:reduce){.world{transition:none}}
</style></head><body><main><header class="brand"><i>✦</i> FAMILY / LEARNING LAB</header><p class="eyebrow">A PLAYGROUND FOR BIG IDEAS</p><h1>Small worlds.<br><span>Big discoveries.</span></h1><p class="intro">Choose a world. Experiment, change your mind, and discover a new way to think.</p><section class="worlds" aria-label="Learning activities">${activities.map(a=>`<a class="world" href="${e(a.href)}">${a.thumbnail?`<img src="${e(a.thumbnail)}" alt="${e(a.title)} interactive world" width="1352" height="775">`:''}<div class="copy"><div class="tags">${a.tags.map(t=>`<span class="tag">${e(t)}</span>`).join('')}</div><h2>${e(a.title)}</h2><p>${e(a.description)}</p><span class="audience">${e(a.audience)}</span><span class="launch">Enter this world <b>→</b></span></div></a>`).join('')}</section><footer class="footer"><span>Follow your curiosity. Build your own latticework.</span><a href="credits.html">Sources & credits</a></footer></main></body></html>`;}
function credits(activities){return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sources & credits</title><body style="max-width:850px;margin:auto;padding:35px 22px;background:#18182b;color:#eee1ff;font:16px/1.7 system-ui"><a style="color:#c7ff79" href="./">← Learning Lab</a><h1>Sources & credits</h1><p>Learning activities use the Marble Skill Taxonomy by Generative Spark, Inc. (Marble). Taxonomy data: ODbL 1.0; Marble-authored text: CC BY-SA 4.0. Individual lessons record their narrower learning objectives and assumptions. A correct response is one observation, not overall mastery.</p>${activities.map(a=>`<h2>${e(a.title)}</h2><p><a style="color:#c7ff79" href="${e(a.href)}ATTRIBUTION.md">Full attribution</a> · <a style="color:#c7ff79" href="${e(a.href)}LICENSE-CONTENT">Content licence</a> · <a style="color:#c7ff79" href="${e(a.href)}licenses/THIRD-PARTY.md">Runtime licences</a></p>`).join('')}</body></html>`;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(json(buildHosting()));
