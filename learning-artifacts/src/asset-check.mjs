import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { packageRoot, pythonExecutable } from './taxonomy.mjs';
import { serveDirectory } from './server.mjs';
import { runProcess } from './verify.mjs';

export async function verifyAsset(artifact,asset,report) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'taxonomy-asset-check-'));
  try {
    fs.cpSync(path.join(artifact,'chunks'),path.join(root,'chunks'),{recursive:true});
    fs.copyFileSync(asset,path.join(root,'asset.glb'));
    const module=fs.readdirSync(path.join(root,'chunks')).find(n=>n.startsWith('three-stage-')&&n.endsWith('.js'));
    if(!module)throw new Error('Generate a Three.js lesson first; its bundled renderer is needed for the GLB integration check.');
    fs.writeFileSync(path.join(root,'index.html'),'<!doctype html><html><body style="margin:0"><div id="stage" style="position:relative;width:500px;height:400px"></div><script type="module">import {createThreeStage} from "./chunks/'+module+'";try{const p=await createThreeStage(document.getElementById("stage"),"shapes",{asset:"./asset.glb"});p.render({shape:"cube",rotation:35});const c=document.querySelector("canvas");const gl=c.getContext("webgl2");const px=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,px);let n=0;for(let i=0;i<px.length;i+=4)if(Math.abs(px[i]-231)+Math.abs(px[i+1]-238)+Math.abs(px[i+2]-230)>30)n++;window.assetResult={...p.info,non_background_pixels:n};}catch(e){window.assetResult={error:e.message};}</script></body></html>');
    const server=await serveDirectory(root);
    try {
      const result=await runProcess(pythonExecutable,[path.join(packageRoot,'scripts/verify_asset.py'),'--url','http://127.0.0.1:'+server.port,'--report',path.resolve(report)],{timeout:90000});
      const data=JSON.parse(result.stdout);
      if(result.code!==0)throw new Error('GLB browser loading/render check failed: '+JSON.stringify(data));
      return data;
    } finally {await server.close();}
  } finally {fs.rmSync(root,{recursive:true,force:true});}
}
