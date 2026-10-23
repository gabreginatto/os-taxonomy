import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const upstream=process.env.ANATOMY_SKILL_DIR||path.join(os.homedir(),'.agents/skills/anatomy');
const revision='1482e8469b0a9e0d8cc18ea2740a01423d29ae80';
if(execFileSync('git',['-C',upstream,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==revision)throw Error('Install the reviewed Anatomy revision first.');
if(execFileSync('git',['-C',upstream,'status','--porcelain','--','kit/iso-kit.mjs'],{encoding:'utf8'}).trim())throw Error('Anatomy kit differs from the pinned revision.');
const k=await import(pathToFileURL(path.join(upstream,'kit/iso-kit.mjs')));
const theta=18*Math.PI/180;
const xyz=([u,v,z])=>[u*Math.cos(theta)+v*Math.sin(theta),-u*Math.sin(theta)+v*Math.cos(theta),z];
const extremes=[];
for(const u of [-154,154])for(const v of [-63,63])for(const z of [-10,0])extremes.push(xyz([u,v,z]));
for(const u of [-132,132])for(const v of [-49,-41])extremes.push(xyz([u,v,58]));
const P=k.fitProjection(extremes,800,370,{pad:52,azimuth:45,elevation:30});
let count=0;const order=[];
const plan=(u,v,w,d,r=1)=>({x:u-w/2,y:v-d/2,w,d,r});
function solid(u,v,w,d,z,h,{tone='mid',r=1,lit=false,detail=true}={}){
  count++;const p=plan(u,v,w,d,r),ring=k.ringOf(p,4).map(([u,v])=>xyz([u,v,0]).slice(0,2));
  const shape=k.extrude(ring,z,h,P,{bevel:.65});
  const screw=detail&&w>18&&d>16?k.dotsSvg(k.corners(p,4).map(([u,v])=>k.iso(xyz([u,v,z+h]),P)),{size:.7,tone:'lo'}):'';
  return k.solidSvg(shape,{tone,lit,inner:screw});
}
function closed(u,v,w,d,z,tone='lo'){
 return k.lineSvg(k.onTop(k.ringOf(plan(u,v,w,d,1),4).map(([u,v])=>xyz([u,v,0]).slice(0,2)),z,P,true),{tone});
}
function part(name,u,v,w,d,z,h,opts){const svg=solid(u,v,w,d,z,h,opts);order.push({name,center:xyz([u,v,z+h/2]),svg});}
for(const u of [-132,132])for(const v of [-43,43])part('foot',u,v,15,15,-15,5,{tone:'lo'});
let body=order.sort((a,b)=>k.depthOf(a.center,P)-k.depthOf(b.center,P)).map(p=>p.svg).join('');order.length=0;
body+=solid(0,0,308,126,-10,8,{tone:'lo',r:6})+solid(0,0,298,116,-2,2,{tone:'mid',r:5})+closed(0,0,287,105,.2,'faint');
const badge=solid(-120,47,29,11,0,.8,{tone:'lo'})+solid(-120,47,25,7,.8,.2,{tone:'hi',detail:false})+k.faceTextSvg(k.topMatrix(xyz([-120,47,0]).slice(0,2),1.1,P),'ONE',{size:3,anchor:'middle',tone:'mid'});
body+=badge;
for(const v of [30,49])body+=solid(0,v,238,3,0,3,{tone:'lo',r:.6,detail:false});
for(const u of [-122,122])body+=solid(u,39.5,6,28,0,7,{tone:'hi'});
const bayCenters=[-96,0,96];const groups=[];
for(const [i,u] of bayCenters.entries()){
 let bay=solid(u,-20,78,67,0,4,{tone:'mid',r:3});
 bay+=solid(u,-20,65,54,4,1,{tone:'lo',r:2});
 for(const x of [u-34,u+34])bay+=solid(x,-45,5,8,4,49,{tone:'mid'});
 bay+=solid(u,-45,73,8,53,5,{tone:'hi'});
 for(const x of [u-29,u+29])bay+=solid(x,8,7,10,4,28,{tone:'hi'});
 // Each gate stays in front of its bay and lifts vertically without crossing another solid.
 bay+=`<g data-gate="${i}">${solid(u,8,51,4,6,4,{tone:'mid'})}</g>`;
 if(i===0){
  for(const x of [u-10,u+10])bay+=solid(x,-18,13,15,5,4,{tone:'hi'});
  for(const x of [u-9,u+9])bay+=solid(x,-20,5,6,9,8,{tone:'mid'});
  bay+=solid(u,-20,27,17,17,20,{tone:'hi',r:2})+solid(u,-20,24,19,37,17,{tone:'hi',r:3});
  for(const x of [u-18,u+18])bay+=solid(x,-20,7,8,20,14,{tone:'mid'});
  for(const x of [u-6,u+6])bay+=solid(x,-10.2,4,1,44,4,{tone:'lo',r:.2,detail:false});
 }else if(i===1){
  bay+=solid(u,-20,28,24,5,4,{tone:'lo'})+solid(u,-20,7,8,9,13,{tone:'mid'});
  bay+=solid(u,-20,33,17,22,23,{tone:'hi',r:2})+solid(u+20,-20,8,14,28,12,{tone:'mid'})+solid(u+26,-20,4,17,26,16,{tone:'hi'});
  bay+=solid(u,-20,36,17,45,5,{tone:'hi'});
  for(let x=-12;x<=12;x+=8)bay+=solid(u+x,-20,4,16,50,.25,{tone:'lo',r:.1,detail:false});
 }else{
  bay+=solid(u,-20,37,27,5,13,{tone:'hi',r:2})+solid(u,-20,31,21,18,.6,{tone:'lo',detail:false});
  bay+=solid(u,-20,6,7,18.6,16,{tone:'mid'});
  for(const [w,z,h]of[[31,34.6,8],[24,42.6,7],[15,49.6,7]])bay+=solid(u,-20,w,w*.7,z,h,{tone:'hi',r:3});
 }
 groups.push(`<g data-bay="${i}">${bay}</g>`);
}
body+=groups.join('');
let ticket=solid(0,39,57,26,3,3,{tone:'hi',r:2})+solid(0,39,41,21,6,1.2,{tone:'hi',lit:true,r:2})+solid(0,39,34,14,7.2,.25,{tone:'hi',lit:true,r:1,detail:false});
const ticks=[];for(let x=-14;x<=14;x+=4)ticks.push(k.lineOnTop(xyz([x,32,0]).slice(0,2),xyz([x,35,0]).slice(0,2),7.5,P));
ticket+=k.lineSvg(ticks.join(''),{tone:'lo'});
body+=`<g id="am-carriage">${ticket}</g>`;
const art=k.figureSvg({width:800,height:370,label:'A ticket machine with robot, movie and outdoor activity bays. One ticket can dock at only one bay. Use the activity buttons below.',body});
const origin=k.iso(xyz([0,0,0]),P);
const basis=[[1,0,0],[0,1,0],[0,0,1]].map(p=>k.iso(xyz(p),P).map((v,i)=>v-origin[i]));
const packet={basis,svg:art,css:k.ISO_CSS,projection:P,bayCenters,solids:count,upstream:{repository:'https://github.com/wheresryan22/anatomy',revision,kit_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(upstream,'kit/iso-kit.mjs'))).digest('hex')}};
const license=fs.readFileSync(path.join(upstream,'LICENSE'),'utf8');fs.writeFileSync(path.join(here,'ANATOMY-LICENSE.txt'),license);
const source='// Generated by build.mjs with Anatomy (MIT, Ryan). See ANATOMY-LICENSE.txt.\nconst ART='+JSON.stringify(packet)+';\n'+fs.readFileSync(path.join(here,'domain.mjs'),'utf8')+'\n'+fs.readFileSync(path.join(here,'presentation.mjs'),'utf8');
fs.writeFileSync(path.join(here,'opportunity-cost-anatomy.plugin.mjs'),source);
fs.writeFileSync(path.join(here,'provenance.json'),JSON.stringify({...packet.upstream,solids:count,representation:'precomputed native isometric SVG',license:'MIT',runtime_network_dependencies:0},null,2)+'\n');
console.log(JSON.stringify({solids:count,bytes:Buffer.byteLength(source),revision}));
