import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {HttpsProxyAgent} from 'https-proxy-agent';
import {hostingRoot,readJson,sha} from './catalog.mjs';

export function getHttps(url){
  const proxy=process.env.HTTPS_PROXY||process.env.https_proxy;
  return new Promise((resolve,reject)=>{
    const request=https.get(url,{...(proxy?{agent:new HttpsProxyAgent(proxy)}:{}),headers:{'Cache-Control':'no-cache'}},response=>{
      const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>resolve({status:response.statusCode,body:Buffer.concat(chunks),headers:response.headers}));
    });request.setTimeout(30000,()=>request.destroy(Error('Public URL request timed out.')));request.on('error',reject);
  });
}
export async function verifyPublic(base,root=hostingRoot){
  const url=new URL(base);if(url.protocol!=='https:'||!url.hostname.endsWith('.web.app'))throw Error('Expected a Firebase HTTPS Hosting URL.');
  url.pathname='/';url.search='';url.hash='';
  const manifest=readJson(path.join(root,'public/build-manifest.json'));
  for(const [file,expected]of Object.entries(manifest.files)){
    const response=await getHttps(new URL(file,url));
    if(response.status!==200||sha(response.body)!==expected)throw Error('Published file did not match the built activity: '+file+' (HTTP '+response.status+').');
  }
  const unknown=await getHttps(new URL('this-activity-does-not-exist/',url));
  if(unknown.status!==404)throw Error('Missing activities should return a real 404.');
  const python=path.resolve(hostingRoot,'../.venv/bin/python'),script=path.join(hostingRoot,'scripts/verify-hosting.py');
  const result=await new Promise((resolve,reject)=>{
    const child=spawn(python,[script,'--root',url.href,'--build',path.join(root,'public/build-manifest.json'),'--out',path.join(root,'.state/public-browser')],{stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='';child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);child.on('error',reject);child.on('close',code=>resolve({code,stdout,stderr}));
  });
  let browser;try{browser=JSON.parse(result.stdout);}catch{throw Error(result.stderr||'No browser report.');}
  if(result.code!==0||browser.status!=='passed')throw Error('Public browser verification failed: '+(browser.error||JSON.stringify(browser.checks)));
  return {status:'passed',files_verified:Object.keys(manifest.files).length,browser,url:url.href};
}
