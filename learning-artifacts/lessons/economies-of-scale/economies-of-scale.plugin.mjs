import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {gsap} from 'gsap';

// Fictional daily configurations, money in integer pence. Rendering never decides truth.
const phases=['share','bottleneck','grow','quiet','transfer'];
const answers={share:['spread','materials','total'],bottleneck:['packing','assembly','equal'],grow:['coordination','biggest','cheapest'],quiet:['demand','bulk','free'],transfer:['profit','bigger','rent']};
const money=c=>'£'+(c/100).toFixed(2).replace(/\.00$/,'');
const fresh=(phase='share',history=[])=>({phase,batch:10,upgrade:'none',teams:phase==='grow'?2:4,plan:'small',answer:null,seenBatches:[10],history,help:false,complete:false});
function costs(s,teamsOverride){
 let requested,assembly,packing,fixed,coordination=0,variableRate;
 if(s.phase==='share'){requested=s.batch;assembly=packing=20;fixed=10000;variableRate=400;}
 else if(s.phase==='bottleneck'){requested=80;assembly=s.upgrade==='assembly'?160:80;packing=s.upgrade==='packing'?80:40;fixed=24000+(s.upgrade==='assembly'?10000:s.upgrade==='packing'?4000:0);variableRate=300;}
 else if(s.phase==='grow'||s.phase==='quiet'){
  const n=teamsOverride??s.teams;requested=s.phase==='grow'?80:20;assembly=packing=20*n;fixed=10000+2500*(n-1);coordination=1500*(n-1)**2;variableRate=400;
 }else{requested=40;assembly=packing=s.plan==='small'?40:120;fixed=s.plan==='small'?12000:30000;coordination=s.plan==='small'?0:18000;variableRate=s.plan==='small'?300:200;}
 const capacity=Math.min(assembly,packing),produced=Math.min(requested,capacity),variable=produced*variableRate,total=fixed+coordination+variable,revenue=produced*1500;
 return {requested,assembly,packing,capacity,fixed,coordination,variableRate,variable,total,produced,unfilled:requested-produced,idle:capacity-produced,average:total/produced,revenue,profit:revenue-total};
}
function curve(s){return [1,2,3,4,5,6].map(teams=>{
 const day=costs({...s,phase:s.phase==='quiet'?'quiet':'grow'},teams);
 const capacity=teams*20,fullTotal=day.fixed+day.coordination+capacity*400;
 return {teams,...day,fullAverage:fullTotal/capacity};
});}
function observe(s){const day=costs(s);return {...s,...day,curve:curve(s),label:day.produced+' completed / '+day.requested+' orders · '+money(day.total)+' total · '+money(day.average)+' per item'};}
function assess(s){
 const day=costs(s);let correct=false,message;
 if(s.phase==='share'){
  correct=s.seenBatches.includes(20)&&s.batch===20&&s.answer==='spread';
  message=correct?'Exactly. £100 is shared across more toys. Total cost rises from £140 to £180, while cost per toy falls from £14 to £9. The £4 variable cost per toy stayed the same. This is fuller use of an existing workshop.':!s.seenBatches.includes(20)||s.batch!==20?'Run the 20-toy day as well as the 10-toy day, then compare total cost with cost per toy.':s.answer==='materials'?'The materials and labor still cost £4 per toy. Look at how much of the £100 fixed cost each toy must carry.':'The 20-toy day costs £180 in total, more than £140. The saving is per toy, because the same £100 is shared.';
 }else if(s.phase==='bottleneck'){
  correct=s.upgrade==='packing'&&s.answer==='packing';
  message=correct?'Yes. Packing limited the workshop to 40 finished toys. Faster assembly alone left output at 40 and added cost. Upgrading packing delivers all 80 at £6.50 per toy.':s.upgrade==='assembly'?'Assembly can now handle 160, but packing still handles only 40. The extra £100 buys no extra finished output. Try the packing station.':s.upgrade==='none'?'Try an upgrade and inspect completed toys, not just one machine’s capacity.':'This plan fulfills 80. Which stage was limiting the original workshop?';
 }else if(s.phase==='grow'){
  correct=s.teams===4&&s.answer==='coordination';
  message=correct?'Four teams fulfill all 80 orders at £630 total (£7.875 per toy, rounded to £7.88). Six teams add idle capacity and coordination costs: £920 for the same 80 toys. Under these assumptions, extra size is expensive.':day.unfilled?'This plan leaves '+day.unfilled+' orders unfilled. The goal is to fulfill all 80 before comparing cost per toy.':s.teams!==4?'This plan fulfills the order, but compare four teams: £630 total. Extra teams add fixed and coordination costs without more sales.':'The graph’s full-capacity curve turns upward because coordination costs eventually outweigh shared-cost savings. That is the model’s diseconomy of scale.';
 }else if(s.phase==='quiet'){
  correct=s.teams===1&&s.answer==='demand';
  message=correct?'With only 20 confirmed orders, one team costs £180 (£9 per toy). Four teams cost £390 (£19.50 per toy). Idle capacity still incurs daily fixed and coordination costs. This compares fresh rental plans for tomorrow; past sunk costs are not refunded.':s.teams!==1?'There are only 20 customers in this scenario. Compare one team with the unused capacity and overhead of a larger plan.':'The order changed from 80 to 20. The cheapest sufficient size changed with it; the £4 variable cost did not change.';
 }else{
  correct=s.plan==='small'&&s.answer==='profit';
  message=correct?'At 40 meals, one stall earns £600 revenue − £240 cost = £360 profit. Three stalls earn £600 − £560 = £40. Cheaper ingredients do not overcome their extra fixed and coordination costs. This is a justified choice for this scenario, not a rule that small always wins.':s.plan!=='small'?'The larger operation saves £1 per meal, only £40 across these customers. It adds £360 in fixed and coordination costs. Compare the whole plan.':'The £120 rent is shared over 40 meals. Check revenue minus the whole day’s cost for each plan.';
 }
 return {correct,message,scope:'this_response_only',kind:s.phase==='transfer'?'new_context_cost_and_profit_comparison':'authored_scale_experiment',assistance:s.help?'help_requested':'help_not_requested',mastery_claim:false};
}
const afterShare=[{type:'batch',value:20},{type:'answer',value:'spread'},{type:'next'}];
const afterPacking=[...afterShare,{type:'upgrade',value:'packing'},{type:'answer',value:'packing'},{type:'next'}];
const afterGrowth=[...afterPacking,{type:'teams',value:4},{type:'answer',value:'coordination'},{type:'next'}];
const afterQuiet=[...afterGrowth,{type:'teams',value:1},{type:'answer',value:'demand'},{type:'next'}];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const plugin={
 id:'economies-of-scale',version:'1.0.0',topicIds:['mt_9gpUHWVKMR'],representation:'threejs',audienceLabel:'Age 15 · Costs, capacity & growth',
 title:'Little Works. Grow wisely.',prompt:'Build enough to meet the order. Discover when getting bigger makes each toy cheaper—and when it does the opposite.',
 reason:'Requested colorful 3D workshop, directly picked assembly and packing stations, replicated team pods, visible capacity and an HTML cost curve. GSAP animates presentation only; the pure cost model determines output and assessment.',
 coverage:[{index:0,mode:'partial',assessed_subclaim:'Interpret fictional fixed/variable/coordination cost and revenue/profit readouts; not a free explanation of every accounting definition.'},{index:1,mode:'partial',assessed_subclaim:'Recognize the correct revenue-minus-total-cost profit comparison in a disclosed food-stall scenario.'}],
 assumptions:[
  'Fictional teaching data. Every daily configuration is available to rent for a fresh next day; changing size does not recover a past sunk investment.',
  'All completed output is sold at £15 per item to confirmed orders. Production stops at demand; no inventory, defects, uncertainty, credit or tax.',
  'Finished output is min(orders, assembly capacity, packing capacity). Variable cost is charged only for finished output; this idealization omits work-in-progress costs.',
  'Coordination = £15(n−1)² and fixed = £100+£25(n−1) in the expansion experiments. These are disclosed authored functions, not empirical business laws.',
  'Fuller utilization within one workshop differs from economies of scale across prospective configurations. Full-capacity comparison makes the distinction explicit.',
  'The objective is fulfill all confirmed orders at the lowest cost per completed item, not maximize total output regardless of demand.',
  'Whole-number arithmetic, division, graph reading and the idea of a daily cost are assumed; age or reported IQ does not establish mastery.',
  'A representative toy is an illustration, not a one-to-one count. Exact outputs, queues and capacity are displayed as model numbers.',
  'Supplier bargaining, advertising, brand psychology, network effects, learning curves and financing are discussed as extensions, not simulated or assessed here.',
  'Local Munger attribution relies on an unofficial transcript mirror. This lesson quotes no speech and makes no invention claim. No economics expert, learner or physical-device review.'
 ],
 sources:['https://github.com/gabreginatto/os-taxonomy/blob/main/data/topics.json','Munger_Models/mental-models.json#scale','Munger_Models/course-guidelines.md'],
 contentReview:{status:'source_reviewed',reviewer:'Codex',scope:'Exact local Costs & Revenue evidence, local scale research, explicit fictional equations and independent arithmetic examples. Official OpenStax access blocked; no claim of retrieved external corroboration or expert review.'},
 scenario:[{time:1,action:{type:'batch',value:20}},{time:2,action:{type:'answer',value:'spread'}}],
 fixtures:[
  {actions:[],expectedObservation:{produced:10,total:14000,average:1400},expectedCorrect:false},
  {actions:[{type:'batch',value:20},{type:'answer',value:'spread'}],expectedObservation:{produced:20,total:18000,average:900},expectedCorrect:true},
  {actions:[{type:'batch',value:20},{type:'answer',value:'total'}],expectedObservation:{total:18000},expectedCorrect:false},
  {actions:[...afterShare,{type:'upgrade',value:'assembly'},{type:'answer',value:'packing'}],expectedObservation:{produced:40,total:46000,unfilled:40},expectedCorrect:false},
  {actions:[...afterShare,{type:'upgrade',value:'packing'},{type:'answer',value:'packing'}],expectedObservation:{produced:80,total:52000,average:650},expectedCorrect:true},
  {actions:[...afterPacking,{type:'teams',value:2},{type:'answer',value:'coordination'}],expectedObservation:{produced:40,total:30000,unfilled:40},expectedCorrect:false},
  {actions:[...afterPacking,{type:'teams',value:4},{type:'answer',value:'coordination'}],expectedObservation:{produced:80,total:63000,average:787.5},expectedCorrect:true},
  {actions:[...afterPacking,{type:'teams',value:6},{type:'answer',value:'coordination'}],expectedObservation:{produced:80,total:92000,idle:40},expectedCorrect:false},
  {actions:[...afterGrowth,{type:'teams',value:1},{type:'answer',value:'demand'}],expectedObservation:{produced:20,total:18000,average:900},expectedCorrect:true},
  {actions:[...afterQuiet,{type:'plan',value:'big'},{type:'answer',value:'profit'}],expectedObservation:{revenue:60000,total:56000,profit:4000},expectedCorrect:false},
  {actions:[...afterQuiet,{type:'answer',value:'profit'}],expectedObservation:{revenue:60000,total:24000,profit:36000},expectedCorrect:true},
 ],
 acceptance:[{action:'click',selector:'#sc-batch-20'},{action:'assert_text',selector:'#sc-average',text:'£9'},{action:'click',selector:'#sc-answer-spread'},{action:'assert_observed',field:'produced',value:20}],
 initialState(){return fresh();},observe,assess,
 applyAction(s,{type,value}){
  if(type==='restart')return fresh();
  if(type==='help')return {...s,help:true};
  if(s.complete)throw Error('Completed experiment; restart to change it.');
  if(type==='batch'&&s.phase==='share'&&[10,20].includes(value))return {...s,batch:value,answer:null,seenBatches:[...new Set([...s.seenBatches,value])]};
  if(type==='upgrade'&&s.phase==='bottleneck'&&['none','assembly','packing'].includes(value))return {...s,upgrade:value,answer:null};
  if(type==='teams'&&['grow','quiet'].includes(s.phase)&&Number.isInteger(value)&&value>=1&&value<=6)return {...s,teams:value,answer:null};
  if(type==='plan'&&s.phase==='transfer'&&['small','big'].includes(value))return {...s,plan:value,answer:null};
  if(type==='answer'&&answers[s.phase].includes(value))return {...s,answer:value};
  if(type==='next'&&assess(s).correct){
   const history=[...s.history,{phase:s.phase,answer:s.answer,help:s.help,...costs(s)}];
   const i=phases.indexOf(s.phase);return i===phases.length-1?{...s,history,complete:true}:fresh(phases[i+1],history);
  }
  throw Error('Unsupported scale action or premature progression');
 },
 validateInvariants(s){
  if(!phases.includes(s.phase)||!Number.isInteger(s.teams)||s.teams<1||s.teams>6||![10,20].includes(s.batch)||!['none','assembly','packing'].includes(s.upgrade)||!['small','big'].includes(s.plan)||!Array.isArray(s.seenBatches)||s.seenBatches.some(x=>![10,20].includes(x))||!s.seenBatches.includes(10)||typeof s.help!=='boolean'||typeof s.complete!=='boolean')return false;
  if(s.answer!==null&&!answers[s.phase].includes(s.answer))return false;
  const expected=s.complete?5:phases.indexOf(s.phase);return Array.isArray(s.history)&&s.history.length===expected&&s.history.every((h,i)=>h.phase===phases[i]&&answers[h.phase].includes(h.answer)&&h.produced>0&&h.total===h.fixed+h.coordination+h.variable)&&(!s.complete||s.phase==='transfer'&&assess(s).correct);
 },
 createPresentation
};

const copy={
 share:{kicker:'01 / SHARE THE SETUP',question:'Can a more expensive day produce cheaper toys?',guide:'Tap an order crate to run a 10- or 20-toy day. The workshop costs £100 per day, plus £4 for each finished toy.',quiz:'Why did the 20-toy day cost less per toy?',options:[['spread','The same £100 was shared across more toys.'],['materials','The variable cost fell below £4 per toy.'],['total','The total bill became smaller.']],hint:'Compare £100 ÷ 10 with £100 ÷ 20. Then add the unchanged £4 per toy.'},
 bottleneck:{kicker:'02 / FIND THE BOTTLENECK',question:'80 orders. Why are only 40 toys leaving?',guide:'Try one upgrade at a time. Tap a station or its button. Watch finished output, not just a machine’s capacity.',quiz:'Which stage originally limited finished output?',options:[['packing','Packing: it could finish only 40 per day.'],['assembly','Assembly: faster robots always mean more deliveries.'],['equal','Both upgrades deliver the same extra output.']],hint:'Finished output is limited by the slowest stage. A faster robot cannot make the packing station finish more than 40.'},
 grow:{kicker:'03 / CHOOSE YOUR SCALE',question:'Fulfill 80 orders. How many teams should you rent?',guide:'New expansion model: each team can finish 20 toys. Tap a production pod or a point on the curve to compare tomorrow’s plan.',quiz:'Why can a larger operation become more expensive per toy?',options:[['coordination','Coordination and extra capacity can outweigh shared-cost savings.'],['biggest','The biggest plan must always have the lowest cost.'],['cheapest','The lowest number on the curve wins even if orders go unfilled.']],hint:'First cross out plans that cannot fulfill 80 orders. Then compare total costs. Coordination grows with the square of teams minus one.'},
 quiet:{kicker:'04 / DEMAND CHANGES THE ANSWER',question:'Tomorrow, only 20 customers order. Keep four teams?',guide:'Same rental model, new demand. Compare fresh plans for tomorrow. There is no refund of past investment or sunk costs.',quiz:'Why did the cheapest sufficient workshop change?',options:[['demand','Fewer orders leave expensive capacity idle.'],['bulk','The £4 variable cost fell when orders fell.'],['free','Unused teams stop charging rent automatically.']],hint:'Every team still adds daily rent and coordination overhead. Production stops once the 20 confirmed orders are filled.'},
 transfer:{kicker:'05 / TRY ANOTHER BUSINESS',question:'40 festival customers. One food stall or three?',guide:'Every meal sells for £15. One stall can serve all 40 customers. The larger operation has cheaper ingredients but more overhead.',quiz:'Which comparison justifies your choice?',options:[['profit','One stall earns £360 profit; three earn £40.'],['bigger','Cheaper ingredients make the larger operation more profitable.'],['rent','The £120 daily rent is the cost of each meal.']],hint:'Both plans earn £600. One costs £120 + 40 × £3. The larger plan costs £300 + £180 + 40 × £2.'}
};
function createPresentation(root,{controlsRoot,dispatch}){
 const app=root.closest('.app');app.classList.add('scale-lab');
 const style=document.createElement('style');style.textContent=css;root.append(style);
 const surface=document.createElement('div');surface.className='sc-surface';root.append(surface);
 surface.innerHTML=`<nav class="sc-progress" aria-label="Five experiments">${phases.map((p,i)=>`<span data-step="${p}">${i+1}<small>${['Shared costs','Bottleneck','Expansion','Demand','Transfer'][i]}</small></span>`).join('')}</nav>
 <section class="sc-board"><header class="sc-task"><span class="sc-kicker" id="sc-kicker"></span><h2 id="sc-question" tabindex="-1"></h2><p id="sc-guide"></p></header>
 <div class="sc-world" id="sc-world"><div id="sc-scene-labels" class="sc-scene-labels"></div><div id="sc-capacity-caption" class="sc-capacity-caption"></div><div class="sc-world-note">A miniature illustration · exact quantities below</div></div><div id="sc-config" class="sc-config"></div>
 <p class="sc-outcome" id="sc-outcome" role="status"></p><div class="sc-metrics"><div><span id="sc-output-label">FINISHED / ORDERED</span><strong id="sc-output"></strong></div><div><span>TOTAL DAY COST</span><strong id="sc-total"></strong></div><div class="sc-average"><span>COST / FINISHED ITEM</span><strong id="sc-average"></strong></div></div>
 <div class="sc-ledger" id="sc-ledger"></div><section class="sc-curve" id="sc-curve" hidden><div class="sc-curve-title"><strong>Cost per toy at full capacity</strong><span>Same quality · every available slot used</span></div><div id="sc-bars" class="sc-bars"></div><p>This curve uses full capacity. Your day’s figures above use confirmed orders; unused capacity still costs money.</p></section></section>`;
 controlsRoot.innerHTML=`<section class="sc-challenge" id="sc-challenge"><span class="sc-kicker">MAKE YOUR CASE</span><h2 id="sc-quiz"></h2><div id="sc-answers" class="sc-answers"></div><div class="sc-submit"><button id="sc-help" class="sc-text">Show me a hint</button><span id="sc-check-slot"></span></div><p id="sc-hint" class="sc-hint" hidden></p></section>
 <section id="sc-result" class="sc-result" hidden><h2 id="sc-result-heading" tabindex="-1"></h2><div id="sc-feedback-slot"></div><button id="sc-next" class="sc-primary" hidden></button></section>
 <section id="sc-complete" class="sc-complete" hidden><span class="sc-kicker">FIVE EXPERIMENTS / ONE MODEL</span><h2 tabindex="-1" id="sc-complete-heading">Grow for a reason.</h2><p>Ask what is shared, what limits output, how much demand exists, and what extra coordination costs. Then compare whole plans.</p><div class="sc-recap"><p><strong>Utilization</strong> uses an existing workshop more fully.</p><p><strong>Economies of scale</strong> lower average cost across larger operating configurations.</p><p><strong>Diseconomies of scale</strong> raise average cost when additional overhead outweighs savings.</p></div><p class="sc-small">You checked five fictional scenarios. Try the questions on a new business before drawing a broader conclusion.</p></section>
 <div class="sc-bottom"><span id="sc-reset-slot"></span><details><summary>Equations, assumptions & next questions</summary><div id="sc-notes"></div></details></div>`;
 const $=id=>app.querySelector('#'+id),check=$('check'),feedback=$('feedback'),reset=$('reset'),readout=$('readout');
 const original={check:check.parentNode,feedback:feedback.parentNode,reset:reset.parentNode};$('sc-check-slot').append(check);$('sc-feedback-slot').append(feedback);$('sc-reset-slot').append(reset);readout.classList.add('sr-only');reset.textContent='Restart all experiments';
 app.querySelector('.brand').innerHTML='<span>✦</span> LITTLE WORKS / BIG IDEAS';app.querySelector('.topbar .pill').textContent='For curious minds · age 15';
 $('sc-notes').innerHTML='<p><b>Shared costs:</b> total = £100 + £4 × completed toys. Existing capacity is 20.</p><p><b>Bottleneck:</b> completed = min(orders, assembly capacity, packing capacity). One upgrade at a time; all its extra cost is a daily rental charge.</p><p><b>Expansion:</b> capacity = 20n; fixed = £100 + £25(n−1); coordination = £15(n−1)²; variable = £4 × completed toys. n is the number of teams, 1–6.</p><p><b>Accounting:</b> average cost = total ÷ completed items. Revenue = £15 × sold items. Profit = revenue − total cost. Coordination is another fixed daily charge within each configuration, shown separately to make its growth visible. Everyone meets the same quality standard; every completed item is sold. No stock or work-in-progress is charged in this toy model.</p><p><b>Planning:</b> the goal is to fulfill confirmed orders at the lowest cost per item. These are prospective daily rental plans. Real businesses also face sunk investments, uncertain demand, defects, switching costs and financing.</p><p><b>Beyond this game:</b> bulk purchasing, distribution, specialization and brand familiarity can create other advantages. Network effects and learning from experience are related ideas with different mechanisms. The coordination formula here is invented, not a universal law. Munger’s historical attribution in our local research uses an unofficial transcript mirror; no quotation or authorship claim is made.</p>';
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.4));renderer.setClearColor('#c5b3f2');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','A colorful miniature workshop. Tap an order crate, production station, or team pod. Every action also has a keyboard button below.');$('sc-world').prepend(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-10,10,6,-6,.1,100);camera.position.set(12,12,16);camera.lookAt(0,1,0);
 scene.add(new THREE.HemisphereLight('#fff7eb','#8273b4',1.8));const key=new THREE.DirectionalLight('#fff4de',2.5);key.position.set(-5,13,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;key.shadow.normalBias=.04;key.shadow.bias=-.0002;scene.add(key);
 const world=new THREE.Group();scene.add(world);
 const mats=new Map(),geos=new Map(),textures=[];let pickables=[],targets=[],observed=null,signature='',phaseBefore='',disposed=false,tween=null;
 const info={renderer:'threejs',tool:'Three.js + GSAP',pick_targets:[],geometry:'procedural miniature workshop',device_performance:'not_measured'};
 function mat(color,opacity=1){const id=color+':'+opacity;if(!mats.has(id))mats.set(id,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.03,transparent:opacity<1,opacity}));return mats.get(id);}
 function box(parent,w,h,d,color,x=0,y=0,z=0,opacity=1){const id=[w,h,d].join(':');if(!geos.has(id))geos.set(id,new RoundedBoxGeometry(w,h,d,2,Math.min(.13,w*.17,h*.17,d*.17)));const m=new THREE.Mesh(geos.get(id),mat(color,opacity));m.position.set(x,y,z);m.castShadow=opacity===1;m.receiveShadow=true;parent.add(m);return m;}
 function ball(parent,r,color,x,y,z,opacity=1){const id='sphere'+r;if(!geos.has(id))geos.set(id,new THREE.SphereGeometry(r,12,9));const m=new THREE.Mesh(geos.get(id),mat(color,opacity));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 function label(parent,text,x,y,z,width=2.8){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=112;const ctx=canvas.getContext('2d');ctx.fillStyle='#fbf6ed';ctx.beginPath();ctx.roundRect(3,3,506,106,23);ctx.fill();ctx.font='700 54px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#403452';ctx.fillText(text,256,56,470);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);const material=new THREE.SpriteMaterial({map:texture,depthTest:false});const sprite=new THREE.Sprite(material);sprite.position.set(x,y,z);sprite.scale.set(width,width*112/512,1);sprite.renderOrder=9;parent.add(sprite);return sprite;
 }
 function pick(group,action,point,name){group.userData.action=action;pickables.push(group);targets.push({point:new THREE.Vector3(...point),action,name});}
 function toy(parent,x,y,z,color='#f4c355',size=1){
  const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(size);parent.add(g);box(g,.65,.62,.48,color,0,.46,0);box(g,.5,.4,.45,'#a1e5d7',0,.98,0);ball(g,.055,'#30324c',-.12,1.02,.235);ball(g,.055,'#30324c',.12,1.02,.235);box(g,.21,.22,.35,'#514c79',-.2,.05,0);box(g,.21,.22,.35,'#514c79',.2,.05,0);return g;
 }
 function person(parent,x,z,color='#fa9d91'){
  box(parent,.36,.62,.32,color,x,.76,z);ball(parent,.23,'#ffe0b3',x,1.31,z);box(parent,.53,.12,.44,'#4a5884',x,1.5,z);box(parent,.13,.42,.15,'#49465f',x-.11,.24,z);box(parent,.13,.42,.15,'#49465f',x+.11,.24,z);
 }
 function floor(){box(world,14,.45,8.4,'#a698d2',0,-.42,0);box(world,13.6,.12,8.05,'#f4e8ce',0,-.14,0);for(const x of [-6.1,6.1])for(const z of [-3.2,3.2]){box(world,.6,.5,.6,'#ddd0b9',x,.16,z);ball(world,.48,'#7cbda2',x,.82,z);ball(world,.32,'#96d6ad',x+.15,1.1,z);}box(world,10,.03,.72,'#d2c6bc',0,-.05,3.25);for(let i=0;i<7;i++)box(world,.65,.015,.06,'#fbf5e5',-3.9+i*1.3,-.025,3.25);}
 function truck(){const g=new THREE.Group();g.position.set(4.8,.07,2.8);box(g,1.8,.18,.85,'#4d4b66',0,.25,0);box(g,.6,.8,.84,'#ffb490',.6,.73,0);box(g,.2,.32,.7,'#79bec5',.9,.85,0);box(g,1.1,.45,.76,'#d5f39b',-.25,.57,0);for(const x of [-.6,.6])for(const z of [-.45,.45])ball(g,.21,'#3e3c54',x,.22,z);world.add(g);}
 function station(x,kind,capacity,active=true){const g=new THREE.Group();g.position.set(x,0,-.45);world.add(g);const tint=kind==='assembly'?'#83dace':'#f0a4bb';box(g,3.35,.18,3,'#b9aad8',0,.04,0);box(g,2.6,.8,1.9,tint,0,.53,0);box(g,2.8,.15,2.05,'#f5ecd5',0,1.02,0);
  if(kind==='assembly'){
   for(const dx of [-.9,.9]){box(g,.23,1.35,.24,'#568fa5',dx,1.72,-.6);box(g,.9,.23,.35,'#8ee2df',dx*.55,2.25,-.6);ball(g,.2,'#fff0bc',dx*.55,2.1,-.6);}toy(g,0,1.14,.2,'#f6c96c',.8);person(g,-1.4,1.13,'#94c8f1');
  }else{box(g,1.7,.13,1.1,'#7c739e',0,1.15,0);for(let i=0;i<3;i++)box(g,.45,.4,.45,'#e8bd89',-.5+i*.5,1.4,0);box(g,.14,1.25,.2,'#a66f99',-1.12,1.7,-.6);box(g,.14,1.25,.2,'#a66f99',1.12,1.7,-.6);box(g,2.4,.22,.25,'#ffc3d5',0,2.3,-.6);person(g,1.4,1.2,'#e2b1ee');}
  label(g,(kind==='assembly'?'BUILD ':'PACK ')+capacity+'/day',0,3,0,3.1);return g;
 }
 function build(o){
  if(tween){tween.kill();tween=null;}world.scale.setScalar(1);for(const child of [...world.children])world.remove(child);
  // Sprite labels are the only per-scene resources. Geometry/material caches are reused.
  for(const t of textures.splice(0))t.dispose();for(const m of sceneLabels.splice(0))m.dispose();pickables=[];targets=[];floor();truck();
  if(o.phase==='share'){
   const s=station(0,'assembly',20);label(world,'£100 / day',0,4,-1,3);
   for(const [n,x]of[[10,-4],[20,4]]){const g=new THREE.Group();g.position.set(x,0,.8);world.add(g);box(g,1.8,.85,1.45,n===o.batch?'#d7f38f':'#dfc997',0,.42,0);for(let j=0;j<(n===10?1:3);j++)toy(g,-.4+(j%2)*.7,.88,-.15+Math.floor(j/2)*.6,'#f6b97d',.42);label(g,n+' orders',0,2,0,2.5);pick(g,{type:'batch',value:n},[x,.8,.8],n+' orders');}
   label(s,'£4 / finished toy',0,-.1,1.75,2.7);
  }else if(o.phase==='bottleneck'){
   const a=station(-3,'assembly',o.assembly),b=station(3,'packing',o.packing);pick(a,{type:'upgrade',value:'assembly'},[-3,1,-.45],'assembly');pick(b,{type:'upgrade',value:'packing'},[3,1,-.45],'packing');box(world,2.3,.15,.8,'#8273a7',0,.63,-.45);for(let j=0;j<(o.upgrade==='packing'?1:4);j++)toy(world,-.6+j*.45,.72,-.45,'#f4c35b',.42);label(world,o.unfilled+' orders waiting',0,3.8,-2.8,3.9);
  }else if(o.phase==='grow'||o.phase==='quiet'){
   const mobile=$('sc-world').clientWidth<600;
   for(let n=1;n<=6;n++){
    const x=mobile?(n%2===1?-2.8:2.8):((n-1)%3-1)*4.1,z=mobile?Math.floor((n-1)/2)*2.4-2.4:Math.floor((n-1)/3)*3.1-1.9;
    const g=new THREE.Group();g.position.set(x,0,z);world.add(g);const enabled=n<=o.teams,op=enabled?1:.3;
    box(g,3.2,.14,2.3,enabled?'#b6d4ba':'#b6acc6',0,.04,0,op);box(g,2.55,.56,1.55,n===o.teams?'#cdf089':'#8fd5c5',0,.39,0,op);box(g,2.75,.16,1.7,'#fff2d4',0,.75,0,op);box(g,.2,.8,.2,'#658fa3',-.92,1.18,-.45,op);box(g,.2,.8,.2,'#658fa3',.92,1.18,-.45,op);box(g,2.2,.18,.24,'#93c6e5',0,1.64,-.45,op);if(enabled){toy(g,-.4,.87,0,'#f2bb73',.52);box(g,.5,.46,.5,'#e5bb87',.65,1.02,0);}
    label(g,'TEAM '+n,0,2.25,0,2);pick(g,{type:'teams',value:n},[x,.6,z],'team-'+n);
   }
   label(world,'Coordination '+money(o.coordination),0,4.2,-3.6,4.4);
  }else{
   for(const [plan,x]of[['small',-3.4],['big',3.2]]){
    const g=new THREE.Group();g.position.set(x,0,-.4);world.add(g);const selected=plan===o.plan;box(g,4,.15,3.3,selected?'#d7efa3':'#c4b2db',0,.04,0);
    const count=plan==='small'?1:3;for(let i=0;i<count;i++){const dx=count===1?0:(i-1)*1.15;box(g,.95,.9,1,'#fab799',dx,.55,0);for(const sx of [-.4,.4])box(g,.08,1.2,.09,'#6d738d',dx+sx,1.55,-.35);box(g,1.06,.18,1.1,i%2?'#b0d99c':'#f5db7f',dx,2.23,0);ball(g,.14,'#f5d58c',dx,1.12,.2);}
    label(g,plan==='small'?'ONE STALL':'THREE STALLS',0,3,0,3.2);pick(g,{type:'plan',value:plan},[x,.7,-.4],plan);
   }
  }
  // Track sprite materials separately; they are not cached across scene rebuilds.
  world.traverse(x=>{if(x.isSprite)sceneLabels.push(x.material);});resize();
 }
 const sceneLabels=[];
 function resize(){
  if(disposed)return;const width=$('sc-world').clientWidth,height=$('sc-world').clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);world.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(world),center=bounds.getCenter(new THREE.Vector3());camera.position.copy(center).add(new THREE.Vector3(12,12,16));camera.lookAt(center);camera.updateMatrixWorld(true);
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  const include=(p)=>{minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);};
  // Fit actual rendered parts, rather than the empty upper corners of one giant box.
  world.traverse(node=>{
   if(node.isSprite){const p=node.getWorldPosition(new THREE.Vector3()).applyMatrix4(camera.matrixWorldInverse),scale=node.getWorldScale(new THREE.Vector3());include(new THREE.Vector3(p.x-scale.x/2,p.y-scale.y/2,0));include(new THREE.Vector3(p.x+scale.x/2,p.y+scale.y/2,0));}
   else if(node.isMesh){node.geometry.computeBoundingBox();const b=node.geometry.boundingBox;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])include(new THREE.Vector3(x,y,z).applyMatrix4(node.matrixWorld).applyMatrix4(camera.matrixWorldInverse));}
  });
  const halfY=Math.max((maxY-minY)/2,(maxX-minX)/2/(width/height))*1.1,cx=(minX+maxX)/2,cy=(minY+maxY)/2;
  camera.top=cy+halfY;camera.bottom=cy-halfY;camera.left=cx-halfY*width/height;camera.right=cx+halfY*width/height;camera.updateProjectionMatrix();paint();
  info.pick_targets=targets.map(t=>{const p=t.point.clone().project(camera);return {name:t.name,action:t.action,x:(p.x+1)/2,y:(1-p.y)/2};});
 }
 function paint(){if(!disposed)renderer.render(scene,camera);}
 const resizeObserver=new ResizeObserver(()=>{if(!observed)return;const mobile=$('sc-world').clientWidth<600;if(['grow','quiet'].includes(observed.phase)&&mobile!==wasMobile){wasMobile=mobile;build(observed);}else resize();});let wasMobile=$('sc-world').clientWidth<600;resizeObserver.observe($('sc-world'));
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 function hit(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);for(const h of ray.intersectObjects(pickables,true)){let node=h.object;while(node&&!node.userData.action)node=node.parent;if(node?.userData.action)return node.userData.action;}return null;}
 const onDown=e=>{down={x:e.clientX,y:e.clientY};},onUp=e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>10){down=null;return;}down=null;const action=hit(e);if(action&&!observed.complete)dispatch(action);},onMove=e=>{renderer.domElement.style.cursor=hit(e)&&!observed.complete?'pointer':'default';};renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('pointermove',onMove);
 const onCancel=()=>{down=null;};renderer.domElement.addEventListener('pointercancel',onCancel);
 const focus=(element)=>{element.focus({preventScroll:true});const r=element.getBoundingClientRect();if(r.top<10||r.bottom>innerHeight-50)element.scrollIntoView({behavior:'instant',block:'start'});};
 function button(id,text,type,value,selected=false){return `<button id="${id}" data-sc-type="${type}" data-sc-value="${value}" aria-pressed="${selected}">${text}</button>`;}
 function actions(event){const b=event.target.closest('[data-sc-type]');if(!b)return;const type=b.dataset.scType;dispatch({type,value:['batch','teams'].includes(type)?Number(b.dataset.scValue):b.dataset.scValue});}
 $('sc-config').addEventListener('click',actions);$('sc-bars').addEventListener('click',actions);$('sc-answers').addEventListener('click',actions);$('sc-help').onclick=()=>dispatch({type:'help'});$('sc-next').onclick=()=>dispatch({type:'next'});
 function render(o,time,{seeking=false}={}){
  const active=document.activeElement?.id;observed=o;const c=copy[o.phase],changed=phaseBefore!==o.phase;
  $('sc-kicker').textContent=c.kicker;$('sc-question').textContent=c.question;$('sc-guide').textContent=c.guide;
  surface.querySelectorAll('[data-step]').forEach(n=>n.setAttribute('aria-current',n.dataset.step===o.phase?'step':'false'));
  let config='';
  if(o.phase==='share')config='<span>RUN A DAY</span>'+[10,20].map(n=>button('sc-batch-'+n,n+' toys','batch',n,o.batch===n)).join('');
  else if(o.phase==='bottleneck')config='<span>ONE UPGRADE AT A TIME</span>'+[['none','Original workshop'],['assembly','Assembly ×2 · +£100/day'],['packing','Packing ×2 · +£40/day']].map(([id,title])=>button('sc-upgrade-'+id,title,'upgrade',id,o.upgrade===id)).join('');
  else if(['grow','quiet'].includes(o.phase))config='<span>RENT TOMORROW’S TEAM COUNT</span>'+[1,2,3,4,5,6].map(n=>button('sc-teams-'+n,String(n),'teams',n,o.teams===n)).join('');
  else config='<span>COMPARE THE WHOLE PLAN</span>'+button('sc-plan-small','One stall · capacity 40','plan','small',o.plan==='small')+button('sc-plan-big','Three stalls · capacity 120','plan','big',o.plan==='big');
  $('sc-config').innerHTML=config;$('sc-capacity-caption').textContent=o.phase==='bottleneck'?'Assembly '+o.assembly+'/day → Packing '+o.packing+'/day':'';$('sc-capacity-caption').hidden=o.phase!=='bottleneck';$('sc-output').textContent=o.produced+' / '+o.requested;$('sc-total').textContent=money(o.total);$('sc-average').textContent=money(o.average);
  $('sc-outcome').dataset.met=String(o.unfilled===0);$('sc-outcome').textContent=o.unfilled?o.unfilled+' orders still unfilled · capacity '+o.capacity+'/day':'All '+o.requested+' orders fulfilled'+(o.idle?' · '+o.idle+' unused slots':' · capacity fully used');
  const transfer=o.phase==='transfer';
  $('sc-ledger').innerHTML=`<div><span>Base fixed / day</span><strong>${money(o.fixed)}</strong></div><b>+</b><div><span>Coordination / day</span><strong>${money(o.coordination)}</strong></div><b>+</b><div><span>${o.produced} × ${money(o.variableRate)} variable</span><strong>${money(o.variable)}</strong></div><b>=</b><div><span>Total / day</span><strong>${money(o.total)}</strong></div><p class="sc-unit-equation">${money(o.total)} total ÷ ${o.produced} finished = <strong>${money(o.average)} per item</strong></p>`+(transfer?`<p class="sc-profit">${money(o.revenue)} revenue − ${money(o.total)} total cost = <strong>${money(o.profit)} profit</strong></p>`:'');
  $('sc-curve').hidden=!['grow','quiet'].includes(o.phase);
  if(!$('sc-curve').hidden){$('sc-bars').innerHTML=o.curve.map(point=>`<button id="sc-curve-${point.teams}" data-sc-type="teams" data-sc-value="${point.teams}" aria-pressed="${o.teams===point.teams}" aria-label="${point.teams} teams, ${point.capacity} capacity, full-capacity cost ${money(point.fullAverage)}, ${point.unfilled} unfilled orders"><strong>${money(point.fullAverage)}</strong><i style="height:${point.fullAverage/900*72}px"></i><b>${point.teams} ${point.teams===1?'team':'teams'}</b><small>${point.capacity} capacity</small><em data-met="${point.unfilled===0}">${point.unfilled?point.unfilled+' short':'Order fits'}</em></button>`).join('');}
  $('sc-quiz').textContent=c.quiz;$('sc-answers').innerHTML=c.options.map(([id,text])=>button('sc-answer-'+id,esc(text),'answer',id,o.answer===id)).join('');
  check.textContent='Check my reasoning →';check.disabled=!o.answer;$('sc-hint').hidden=!o.help;$('sc-hint').textContent=c.hint;
  $('sc-result').hidden=true;$('sc-next').hidden=true;$('sc-challenge').hidden=o.complete||(o.phase==='share'&&o.batch!==20)||(o.phase==='bottleneck'&&o.upgrade==='none');$('sc-complete').hidden=!o.complete;
  surface.querySelectorAll('button').forEach(b=>b.disabled=o.complete);
  const nextSignature=[o.phase,o.batch,o.upgrade,o.teams,o.plan].join(':');
  if(nextSignature!==signature){signature=nextSignature;build(o);if(!seeking&&!matchMedia('(prefers-reduced-motion: reduce)').matches){tween=gsap.fromTo(world.scale,{x:.97,y:.97,z:.97},{x:1,y:1,z:1,duration:.28,ease:'power2.out',onUpdate:paint,onComplete:()=>{tween=null;}});}}
  if(seeking){if(tween){tween.kill();tween=null;}world.scale.setScalar(1);paint();}
  if(active&&!changed&&!seeking){const target=app.querySelector('#'+active);if(target&&!target.disabled)target.focus({preventScroll:true});}
  if(changed){phaseBefore=o.phase;if(!seeking&&phases.indexOf(o.phase)>0)focus($('sc-question'));}
  if(o.complete&&!seeking)focus($('sc-complete-heading'));
 }
 function onAssessment(a){$('sc-result').hidden=false;$('sc-result').dataset.correct=String(a.correct);$('sc-result-heading').textContent=a.correct?'Your reasoning fits this scenario.':'Recheck the evidence.';$('sc-next').hidden=!a.correct;$('sc-next').textContent=observed.phase==='transfer'?'Finish the experiments →':'Next experiment →';focus($('sc-result-heading'));}
 return {render,onAssessment,info,dispose(){disposed=true;if(tween)tween.kill();resizeObserver.disconnect();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('pointercancel',onCancel);for(const t of textures)t.dispose();for(const m of sceneLabels)m.dispose();for(const m of mats.values())m.dispose();for(const g of geos.values())g.dispose();renderer.dispose();original.check.prepend(check);original.feedback.append(feedback);original.reset.append(reset);readout.classList.remove('sr-only');app.classList.remove('scale-lab');style.remove();}};
}

const css=`
body:has(.scale-lab){background:#191a2d;color:#fcf9f2}.scale-lab{max-width:1120px;padding:25px 34px;font-family:"Avenir Next",ui-rounded,system-ui,sans-serif}.scale-lab .topbar{margin-bottom:30px}.scale-lab .brand{font-size:11px;letter-spacing:.12em}.scale-lab .brand span{background:#d4f393;color:#35452a;width:29px;height:29px}.scale-lab .pill{border-color:#51465f;color:#c0b6d2;font-size:11px}.scale-lab #title{font-size:clamp(34px,5vw,53px);letter-spacing:-.05em;margin:0 0 10px;max-width:none;line-height:1.1}.scale-lab #prompt{color:#c2b8d2;font-size:16px;line-height:1.6;max-width:820px;margin:0 0 26px}.scale-lab .layout{display:block}.scale-lab .stage,.scale-lab .stage-wrap{height:auto;min-height:0;padding:0;border:0;border-radius:0;overflow:visible;background:transparent;display:block}.scale-lab .panel{padding:0;background:transparent;border:0}.scale-lab #eyebrow,.scale-lab .lesson-nav,.scale-lab .stage-note,.scale-lab .panel>h2,.scale-lab .panel>.buttons{display:none}.scale-lab [hidden]{display:none!important}.scale-lab button{font:inherit;min-height:44px;cursor:pointer}.scale-lab button:disabled{cursor:default}.scale-lab button:focus-visible{outline:3px solid #ffcb86;outline-offset:3px}.sc-progress{display:flex;justify-content:space-between;gap:12px;margin:0 0 18px;color:#a296b4}.sc-progress span{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700}.sc-progress small{font-size:10px;font-weight:500}.sc-progress [aria-current=step]{color:#d9fa9f}.sc-board{background:#e6d9ff;color:#3b2d4b;border-radius:24px;overflow:hidden}.sc-task{padding:24px 28px 0}.sc-kicker{font-size:10px;font-weight:800;letter-spacing:.12em;color:#8b77a8}.sc-task .sc-kicker{color:#766085}.sc-task h2{font-size:clamp(23px,3vw,31px);line-height:1.2;letter-spacing:-.025em;margin:10px 0}.sc-task p{font-size:14px;line-height:1.6;margin:0;max-width:780px;color:#6c577d}.sc-world{height:380px;position:relative;background:#c5b3f2;margin-top:17px;touch-action:pan-y}.sc-world canvas{position:absolute;display:block;width:100%;height:100%;inset:0;touch-action:pan-y}.sc-capacity-caption{position:absolute;top:12px;left:16px;right:16px;text-align:center;font-size:12px;line-height:1.7;font-weight:700;color:#594574;background:#e8d9ffcc;border-radius:12px;padding:7px;pointer-events:none}.sc-world-note{position:absolute;bottom:9px;left:0;right:0;text-align:center;font-size:9px;color:#71578e;pointer-events:none}.sc-config{display:flex;gap:9px;align-items:center;padding:17px 24px 10px;flex-wrap:wrap}.sc-config>span{font-size:9px;letter-spacing:.08em;font-weight:800;color:#7e6895;margin-right:auto}.scale-lab .sc-config button{background:#f8f3ff;color:#49385e;border:1px solid #bfa8da;border-radius:11px;font-size:12px;padding:10px 14px}.scale-lab .sc-config button[aria-pressed=true]{background:#d4ef9f;border:2px solid #69883e;color:#344b23;padding:9px 13px}.sc-outcome{margin:0;padding:8px 24px 14px;font-size:12px;color:#876177}.sc-outcome[data-met=true]{color:#4d6e35}.sc-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding:0 24px 18px}.sc-metrics>div{background:#f9f3ff;border-radius:15px;padding:16px 17px}.sc-metrics span{display:block;font-size:9px;letter-spacing:.07em;font-weight:800;color:#887296}.sc-metrics strong{display:block;font-size:32px;line-height:1.2;letter-spacing:-.04em;margin-top:9px;color:#43314e}.sc-metrics .sc-average{background:#d6f39e}.sc-average span{color:#637b46}.sc-average strong{color:#344e20}.sc-ledger{background:#d8c6f0;display:flex;gap:16px;justify-content:space-between;align-items:center;padding:15px 25px;flex-wrap:wrap}.sc-ledger div>span{display:block;font-size:10px;color:#755e8b;line-height:1.5}.sc-ledger strong{display:block;font-size:14px;margin-top:4px;color:#523b68}.sc-ledger>b{color:#a58ab9;font-size:13px}.sc-ledger .sc-unit-equation{width:100%;margin:3px 0 0;padding-top:11px;border-top:1px solid #c4acd9;font-size:12px;color:#775b8f}.sc-unit-equation strong{display:inline;font-size:14px;color:#523b68}.sc-ledger .sc-profit{width:100%;margin:4px 0 0;border-top:1px solid #c4acd9;padding-top:12px;font-size:13px}.sc-profit strong{display:inline;font-size:16px;color:#36562a}.sc-curve{padding:21px 25px 18px;background:#f3eaff}.sc-curve-title{display:flex;justify-content:space-between;align-items:center;gap:15px;font-size:13px;color:#665375}.sc-curve-title span{font-size:10px;color:#9882aa}.sc-bars{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:14px}.scale-lab .sc-bars button{background:#e5d7f5;border:1px solid #ccbadf;border-radius:10px;padding:9px 4px 8px;display:flex;align-items:center;flex-direction:column;justify-content:flex-end;min-height:156px;min-width:0;color:#6d5485}.sc-bars button[aria-pressed=true]{background:#deefbe;border:2px solid #8cab62;padding:8px 3px 7px}.sc-bars button>strong{font-size:12px;font-weight:750}.sc-bars i{display:block;width:50%;background:#b798d4;border-radius:6px 6px 0 0;margin-top:7px;min-height:12px}.sc-bars button[aria-pressed=true] i{background:#8aac65}.sc-bars b{font-size:11px;margin-top:7px}.sc-bars small{font-size:9px;margin-top:4px;white-space:nowrap}.sc-bars em{font-size:9px;font-style:normal;color:#a7616e;margin-top:4px}.sc-bars em[data-met=true]{color:#64824b}.sc-curve>p{font-size:11px;line-height:1.65;color:#8d769e;margin-bottom:0}.sc-challenge{padding:25px 0 0}.sc-challenge h2{font-size:21px;line-height:1.35;margin:9px 0 16px;letter-spacing:-.015em}.sc-answers{display:grid;gap:9px}.scale-lab .sc-answers button{text-align:left;background:#302b45;color:#d8cce8;border:1px solid #504461;border-radius:12px;padding:14px 17px;font-size:13px;line-height:1.5}.scale-lab .sc-answers button[aria-pressed=true]{background:#3a4b2d;color:#e5f8c8;border:2px solid #95b969;padding:13px 16px}.sc-submit{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:17px}.scale-lab .sc-text,.scale-lab #reset{background:transparent;border:0;padding:8px 0;color:#b9aacc;font-size:12px}.scale-lab #check,.scale-lab .sc-primary{background:#d3f394;color:#314121;border:0;border-radius:12px;padding:14px 23px;min-height:48px;font-size:13px;font-weight:750}.scale-lab #check:disabled{background:#454151;color:#a19aa8}.sc-hint{padding:17px 20px;background:#302c40;border:1px solid #55465f;border-radius:13px;color:#cec0df;font-size:13px;line-height:1.7}.sc-result{margin-top:22px;background:#f6f0df;color:#40333f;border:1px solid #e6dbbb;border-radius:20px;padding:23px 27px}.sc-result[data-correct=false]{background:#3b2b3b;color:#f5d5de;border-color:#8c5d76}.sc-result h2{font-size:25px;margin:0 0 10px;line-height:1.2;letter-spacing:-.025em}.scale-lab .sc-result .feedback{min-height:0;padding:5px 0 17px;color:inherit;font-size:14px;line-height:1.75}.sc-result .sc-primary{background:#36512b;color:#f2f8e8}.sc-complete{background:#e5efce;color:#3e5130;border-radius:20px;padding:27px 30px;margin-top:24px}.sc-complete h2{font-size:37px;letter-spacing:-.04em;margin:9px 0 14px}.sc-complete>p{font-size:16px;line-height:1.7}.sc-recap{border-top:1px solid #bacd99;margin-top:20px;padding-top:8px}.sc-recap p{font-size:13px;line-height:1.7}.sc-complete .sc-small{font-size:12px;color:#71815b}.sc-bottom{margin-top:17px}.sc-bottom details{margin:12px 0;border-top:1px solid #44384f;padding:16px 0;font-size:12px;line-height:1.8;color:#b8a9c9}.sc-bottom summary{cursor:pointer;min-height:44px;font-weight:650}.scale-lab .explain{border-color:#44384f;color:#a896bd;font-size:11px}.scale-lab .footer{font-size:9px;color:#9986aa}
@media(max-width:650px){.scale-lab{padding:19px 13px}.scale-lab .topbar{margin-bottom:25px}.scale-lab .pill{display:none}.scale-lab #title{font-size:36px}.scale-lab #prompt{font-size:14px;margin-bottom:21px}.sc-progress{gap:5px;margin-bottom:14px}.sc-progress span{display:block;text-align:center;font-size:10px}.sc-progress small{display:block;margin-top:6px;font-size:8px}.sc-board{border-radius:19px}.sc-task{padding:20px 16px 0}.sc-task h2{font-size:24px}.sc-task p{font-size:12px;line-height:1.7}.sc-kicker{font-size:9px}.sc-world{height:265px;margin-top:13px}.sc-world-note{font-size:8px;bottom:8px}.sc-config{gap:6px;padding:14px 12px 7px}.sc-config>span{width:100%;margin:0 0 4px;font-size:8px}.scale-lab .sc-config button{font-size:10px;padding:9px 10px;flex:1}.scale-lab .sc-config button[aria-pressed=true]{padding:8px 9px}.sc-outcome{padding:9px 14px 14px;font-size:11px;line-height:1.6}.sc-metrics{gap:6px;padding:0 10px 14px}.sc-metrics>div{padding:12px 10px;border-radius:12px}.sc-metrics span{font-size:7px;line-height:1.5;min-height:22px;letter-spacing:.02em}.sc-metrics strong{font-size:24px;margin-top:6px;white-space:nowrap}.sc-ledger{padding:13px 14px;gap:9px;display:grid;grid-template-columns:1fr auto 1fr}.sc-ledger>div:nth-of-type(4){grid-column:3}.sc-ledger>div:nth-of-type(3){grid-column:1}.sc-ledger>b:nth-of-type(2){display:none}.sc-ledger strong{font-size:12px}.sc-ledger div>span{font-size:9px}.sc-ledger .sc-unit-equation{grid-column:1/-1;font-size:10px;line-height:1.7}.sc-unit-equation strong{font-size:12px}.sc-ledger .sc-profit{grid-column:1/-1;font-size:11px;line-height:1.65}.sc-profit strong{font-size:13px}.sc-curve{padding:17px 10px 15px}.sc-curve-title{display:block;font-size:12px}.sc-curve-title span{display:block;font-size:9px;margin-top:5px}.sc-bars{gap:4px}.scale-lab .sc-bars button{border-radius:8px;min-height:150px;padding:8px 2px}.sc-bars button[aria-pressed=true]{padding:7px 1px}.sc-bars button>strong{font-size:10px}.sc-bars b{font-size:9px}.sc-bars small{font-size:7px}.sc-bars em{font-size:7px}.sc-curve>p{font-size:10px}.sc-challenge{padding-top:23px}.sc-challenge h2{font-size:19px;line-height:1.4}.scale-lab .sc-answers button{padding:12px 14px;font-size:12px}.scale-lab .sc-answers button[aria-pressed=true]{padding:11px 13px}.scale-lab #check,.scale-lab .sc-primary{font-size:12px;padding:13px 17px}.scale-lab .sc-text,.scale-lab #reset{font-size:11px}.sc-result{padding:22px 19px}.sc-result h2{font-size:23px}.scale-lab .sc-result .feedback{font-size:13px}.sc-result .sc-primary{width:100%}.sc-complete{padding:24px 21px}.sc-complete h2{font-size:33px}.sc-complete>p{font-size:14px}.sc-recap p{font-size:12px}}
@media(max-width:350px){.sc-metrics>div{padding:10px 7px}.sc-metrics strong{font-size:22px}.sc-metrics span{font-size:6px}.sc-progress small{font-size:7px}.sc-bars b{font-size:8px}.sc-bars small,.sc-bars em{font-size:6px}.sc-task h2{font-size:22px}}
`;
