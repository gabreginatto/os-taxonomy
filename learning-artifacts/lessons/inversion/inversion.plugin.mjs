import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {gsap} from 'gsap';

// A disclosed fictional mission, not a rocket simulator. Rules are deterministic.
const configurations={guided:{hatchOpen:true,beaconOn:true,seedsLoaded:true,badgePolished:false,beaconClean:false},challenge:{hatchOpen:true,beaconOn:false,seedsLoaded:true,badgePolished:false,beaconClean:false}};
const systems=['hatch','beacon','badge'];
const predictions=['spill','wrong-moon','none','empty'];
const repairs={hatch:['seal','unload','load'],beacon:['wake','clean'],badge:['polish']};
const configOf=s=>Object.fromEntries(Object.keys(configurations.guided).map(k=>[k,s[k]]));
const fresh=(mission='guided')=>({mission,phase:'briefing',...configurations[mission],beaconClean:false,system:null,prediction:null,repair:null,history:[],lastChange:null,conclusion:null,conclusionSubmitted:false,usedHelp:false,feedbackSeen:false});
function flight(config){
  const spilled=config.seedsLoaded&&config.hatchOpen;
  const empty=!config.seedsLoaded,wrongMoon=!config.beaconOn;
  const delivered=!empty&&!spilled&&!wrongMoon?3:0;
  return {delivered,spilled,empty,wrongMoon,destination:wrongMoon?'Quiet Moon':'Moon Garden',goalMet:delivered===3,
    failures:[...(spilled?['spill']:[]),...(wrongMoon?['wrong-moon']:[]),...(empty?['empty']:[])]};
}
function consequence(s){return s.system==='hatch'?(!s.seedsLoaded?'empty':s.hatchOpen?'spill':'none'):s.system==='beacon'?(!s.beaconOn?'wrong-moon':'none'):'none';}
function repaired(s,id){if(id==='seal')return {...s,hatchOpen:false};if(id==='unload')return {...s,seedsLoaded:false};if(id==='load')return {...s,seedsLoaded:true};if(id==='wake')return {...s,beaconOn:true};if(id==='polish')return {...s,badgePolished:true};if(id==='clean')return {...s,beaconClean:true};throw Error('Unknown repair');}
const name={hatch:'Cargo hatch',beacon:'Garden beacon',badge:'Rocket badge'};
const repairNames={seal:'Close the hatch',unload:'Leave the seeds at the base',load:'Put the seeds back',wake:'Wake the garden beacon',polish:'Straighten the rocket badge',clean:'Polish the beacon casing'};
const predictionNames={spill:'The seeds could escape', 'wrong-moon':'The rocket could go to the wrong moon',none:'This causes no delivery failure',empty:'There are no seeds to deliver'};
function observe(s){
  const last=s.history.at(-1)||null,current=flight(s),expectedPrediction=s.system?consequence(s):null;
  return {...s,expectedPrediction,lastPrediction:last?.prediction||null,lastFlight:last?.outcome||null,currentOutcome:current,
    goalMet:current.goalMet,knownFailureCount:current.failures.length,
    label:s.phase==='briefing'?'Goal: deliver all 3 star-seeds to the Moon Garden.':s.phase==='result'?(last.outcome.goalMet?'Rehearsal passed: 3 of 3 seeds reached the Moon Garden.':'Rehearsal: 0 of 3 seeds reached the Moon Garden.'):s.phase==='inspect'?'Ask what could stop the seeds arriving. Inspect one part.':s.phase==='predict'?'Predict the consequence of this part before changing it.':'Change one thing, then rehearse and check the delivery goal.'};
}
function assess(s){
  const last=s.history.at(-1),correct=s.phase==='complete'&&s.conclusion==='limits'&&!!last?.outcome.goalMet;
  return {correct,scope:'this_response_only',kind:'fictional_causal_rehearsal',assistance:s.usedHelp?'worked_help_requested':s.feedbackSeen?'feedback_seen':'help_not_requested',
    message:correct?'Yes. Prevent the failures you can find, then check whether the goal happened. Both deliveries worked in this toy system. A real mission can have other problems.':s.phase==='conclusion'?'We checked this toy system. A real mission can have other causes of failure. Check the result and stay open to new problems.':!last?'Run a rehearsal and check the delivery goal.':last.outcome.empty?'No seeds escaped, because the rocket carried none. But the goal was to deliver 3 seeds. Avoiding a failure is not enough if the goal is lost.':last.outcome.spilled&&last.outcome.wrongMoon?'Two failure paths remain: the seeds escaped and the sleeping beacon sent the rocket to the wrong moon. Change one cause, rehearse, then check again.':last.outcome.spilled?'The seeds escaped through the open hatch. A change elsewhere did not prevent that failure.':last.outcome.wrongMoon?'The seeds stayed aboard, but the sleeping beacon sent the rocket to the wrong moon. Fixing one failure did not fix the other.':'This rehearsal worked. Now check what that result lets us conclude.'};
}
export const plugin={
  id:'inversion-mission',version:'1.0.0',topicIds:['mt_nNYo5A-7Bl'],representation:'threejs',audienceLabel:'Ages 10 & 15 · Discover + two-cause challenge',
  title:'Save the Moon Garden.',prompt:'Three glowing star-seeds. One delivery. Start by asking what could go wrong.',
  reason:'The requested colorful 3D mission makes causal paths visible: hatch position, retained or spilled cargo, destination beacon, route and delivery. Direct picking inspects a system; GSAP rehearses the pure model’s already computed result.',
  coverage:[{index:1,mode:'partial',assessed_subclaim:'Compare disclosed toy rehearsal outcomes to identify a design weakness; no physical experiment or general inversion mastery.'},{index:2,mode:'partial',assessed_subclaim:'Use delivery results before and after one intervention to improve a fictional design. The system supplies data; free-form explanations and physical construction are not graded.'}],
  assumptions:[
    'Authored inversion extension using Comparing Design Solutions as a narrow foundation. The taxonomy has no direct inversion criterion.',
    'This is a made-up clockwork mission, not real rocket science: an open hatch spills all loaded seeds, and a sleeping garden beacon sends the rocket to Quiet Moon.',
    'The positive goal requires all 3 seeds at Moon Garden. An empty rocket does not meet it, even when no seeds spill. A cosmetic badge has no effect on delivery.',
    'One workshop intervention occurs before each rehearsal. Independent hatch and beacon faults can coexist; fixing one does not remove the other.',
    'Rehearsals are deterministic under the stated rules. Passing them does not prove all real-world failure paths have been found.',
    'Ages do not establish mastery. Compare simple observations and cause-effect relations are assumed; no IQ-based readiness claim is made.',
    'Predictions concern the inspected component before a repair, not all simultaneous faults. Incorrect guesses do not block a repair and remain separately recorded afterward. Assistance exposure remains explicit.',
    'Source review is local taxonomy and Munger course research. Its historical Munger attribution has an unofficial-source limitation; no quote, invention claim or empirical psychology effect is asserted.',
    'Astra directs game design and reviews implementation; that is separate from economist, scientist, learner and physical-device review.'
  ],
  sources:['https://github.com/gabreginatto/os-taxonomy/blob/main/data/topics.json','Munger_Models/mental-models.json#inversion','Munger_Models/course-guidelines.md'],
  contentReview:{status:'source_reviewed',reviewer:'Codex implementation with Astra as design director',scope:'Exact foundation evidence and local inversion definition; explicit fictional causal rules, independent outcomes and bounded assessment. No scientific-simulator or learner-validation claim.'},
  scenario:[{time:.5,action:{type:'baseline'}},{time:1,action:{type:'continue'}},{time:1.5,action:{type:'inspect',value:'hatch'}},{time:1.7,action:{type:'commitInspect'}},{time:2,action:{type:'predict',value:'spill'}},{time:2.3,action:{type:'confirmPrediction'}},{time:2.6,action:{type:'repair',value:'seal'}},{time:3,action:{type:'rehearse'}}],
  fixtures:[],acceptance:[],
  initialState(){return fresh();},
  applyAction(s,{type,value}){
    if(type==='restart')return s.mission==='guided'?fresh():{...fresh('challenge'),phase:'result',history:[{change:'New mission baseline',config:configurations.challenge,outcome:flight(configurations.challenge)}]};
    if(type==='help')return {...s,usedHelp:true};
    if(type==='baseline'&&s.phase==='briefing')return {...s,phase:'result',history:[{change:'First rehearsal',config:configOf(s),outcome:flight(s)}]};
    if(type==='continue'&&s.phase==='result')return {...s,phase:'inspect',system:null,prediction:null,repair:null,lastChange:null};
    if(type==='inspect'&&s.phase==='inspect'&&systems.includes(value)&&(s.mission==='challenge'||value!=='beacon'))return {...s,system:value,prediction:null,repair:null};
    if(type==='commitInspect'&&s.phase==='inspect'&&s.system)return {...s,phase:'predict'};
    if(type==='changePart'&&['predict','repair'].includes(s.phase))return {...s,phase:'inspect',system:null,prediction:null,repair:null};
    if(type==='predict'&&s.phase==='predict'&&predictions.includes(value))return {...s,prediction:value};
    if(type==='confirmPrediction'&&s.phase==='predict'&&s.prediction)return {...s,phase:'repair'};
    if(type==='repair'&&s.phase==='repair'&&repairs[s.system].includes(value))return {...s,repair:value};
    if(type==='rehearse'&&s.phase==='repair'&&s.repair){const next=repaired(s,s.repair),before=consequence(s);return {...next,phase:'result',lastChange:{before:configOf(s),system:s.system,repair:s.repair},history:[...s.history,{change:repairNames[s.repair],before:configOf(s),config:configOf(next),outcome:flight(next),prediction:{system:s.system,answer:s.prediction,beforeCause:before,matched:s.prediction===before}}],feedbackSeen:true};}
    if(type==='undo'&&s.phase==='result'&&s.lastChange)return {...s,...s.lastChange.before,phase:'inspect',system:null,prediction:null,repair:null,lastChange:null};
    if(type==='reveal'&&s.mission==='guided'&&s.phase==='result'&&flight(s).goalMet)return {...s,phase:'reveal'};
    if(type==='nextMission'&&s.phase==='reveal')return {...fresh('challenge'),phase:'result',history:[{change:'New mission baseline',config:configurations.challenge,outcome:flight(configurations.challenge)}]};
    if(type==='conclude'&&s.mission==='challenge'&&s.phase==='result'&&flight(s).goalMet)return {...s,phase:'conclusion'};
    if(type==='conclusion'&&s.phase==='conclusion'&&['limits','guarantee'].includes(value))return {...s,conclusion:value,conclusionSubmitted:false};
    if(type==='submitConclusion'&&s.phase==='conclusion'&&s.conclusion)return {...s,phase:s.conclusion==='limits'?'complete':'conclusion',conclusionSubmitted:true,feedbackSeen:s.feedbackSeen||s.conclusion==='guarantee'};
    throw Error('Unsupported inversion action or phase');
  },
  observe,assess,
  validateInvariants(s){
    if(!configurations[s.mission]||!['briefing','inspect','predict','repair','result','reveal','conclusion','complete'].includes(s.phase))return false;
    if(!['hatchOpen','beaconOn','seedsLoaded','badgePolished','beaconClean','usedHelp','feedbackSeen','conclusionSubmitted'].every(k=>typeof s[k]==='boolean'))return false;
    if(![null,...systems].includes(s.system)||![null,...predictions].includes(s.prediction)||![null,...Object.keys(repairNames)].includes(s.repair)||!Array.isArray(s.history))return false;
    if(['predict','repair'].includes(s.phase)&&!s.system)return false;
    if(s.phase==='repair'&&!s.prediction)return false;
    if(![null,'limits','guarantee'].includes(s.conclusion))return false;
    if(['conclusion','complete'].includes(s.phase)&&(s.mission!=='challenge'||!flight(s).goalMet))return false;
    if(s.phase==='complete'&&(!s.conclusionSubmitted||s.conclusion!=='limits'))return false;
    if(s.repair&&(!s.system||!repairs[s.system].includes(s.repair)))return false;
    if(s.phase==='result'&&!s.history.length)return false;
    if(['result','reveal','conclusion','complete'].includes(s.phase)&&(!s.history.length||JSON.stringify(s.history.at(-1).config)!==JSON.stringify(configOf(s))))return false;
    return s.history.every(r=>r&&typeof r.change==='string'&&r.config&&Object.keys(configurations.guided).every(k=>typeof r.config[k]==='boolean')&&JSON.stringify(r.outcome)===JSON.stringify(flight(r.config))&&(!r.prediction||r.before&&systems.includes(r.prediction.system)&&predictions.includes(r.prediction.answer)&&r.prediction.beforeCause===consequence({...r.before,system:r.prediction.system})&&r.prediction.matched===(r.prediction.answer===r.prediction.beforeCause)));
  },
  createPresentation
};

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const partDescription=s=>s.system==='hatch'?(!s.seedsLoaded?'The cargo bay is empty.':s.hatchOpen?'The cargo hatch is open. The glowing seeds are inside.':'The hatch is closed, with the seeds inside.'):s.system==='beacon'?(s.beaconOn?'The garden beacon is awake.':'The garden beacon is asleep. In this toy world, that sends the rocket to Quiet Moon.'):'The badge decorates the rocket. It is '+(s.badgePolished?'straight.':'crooked.');
function resultTitle(r){return r.goalMet?'The seeds arrived!':r.empty?'Nothing spilled. Nothing arrived.':r.spilled&&r.wrongMoon?'Wrong moon. No seeds.':r.spilled?'Right moon. No seeds.':'Seeds safe. Wrong moon.';}
function resultDescription(r){return r.goalMet?'All 3 star-seeds reached the Moon Garden. The garden can grow.':r.empty?'An empty rocket cannot spill seeds. But the goal was to deliver them.':r.spilled&&r.wrongMoon?'Seeds floated out of the open hatch. The sleeping beacon also sent the rocket to Quiet Moon.':r.spilled?'The rocket arrived at the garden, but the seeds floated out through the open hatch.':'The seeds stayed aboard. The sleeping beacon sent them to Quiet Moon instead of the garden.';}
function createPresentation(root,{controlsRoot,dispatch}){
  const app=root.closest('.app');app.classList.add('inversion-game');
  const style=document.createElement('style');style.textContent=styles;root.append(style);
  const stage=document.createElement('div');stage.className='im-card';root.append(stage);
  stage.innerHTML=`<div class="im-question"><div class="im-mission-row"><span id="inv-stage" class="im-eyebrow"></span><span class="im-goal">GOAL · 3 SEEDS TO MOON GARDEN</span></div><h2 id="inv-question" tabindex="-1"></h2><p id="inv-instruction"></p></div><div id="inv-world" class="im-world"><span id="inv-garden-label" class="im-place">Moon Garden</span><span id="inv-quiet-label" class="im-place im-quiet">Quiet Moon</span><button id="inv-skip" hidden>Show result</button></div><p class="im-caption">A pretend mission. Every flight is a rehearsal.</p>`;
  controlsRoot.innerHTML=`<section id="inv-panel" class="im-panel"><div id="inv-status" class="im-status" hidden></div><div id="inv-parts" class="im-parts" hidden></div><p id="inv-preview" class="im-preview" role="status"></p><div id="inv-choices" class="im-choices"></div><div id="inv-comparison" class="im-comparison" hidden></div><div class="im-actions"><button id="inv-primary" class="im-primary"></button><div id="inv-check-slot"></div><button id="inv-secondary" class="im-link" hidden>Choose another part</button><button id="inv-undo" class="im-link" hidden>Undo this change</button></div><div id="inv-feedback"></div><div id="inv-recap" class="im-recap" hidden></div></section><div class="im-bottom"><button id="inv-help" class="im-link">Give me a hint</button><button id="inv-restart" class="im-link">Restart this mission</button></div><p id="inv-help-text" class="im-hint" hidden></p><details class="im-discuss"><summary>Try the idea outside this world</summary><p>Your group wants to finish a school project by Friday. What could stop that happening? Name one cause, a change that addresses it, and a way to check that the project is actually finished.</p><p>Could one cause create several problems? What might your plan have missed? Talk it through together; this conversation is not automatically graded.</p></details>`;
  const $=id=>app.querySelector('#'+id),check=$('check'),feedback=$('feedback'),reset=$('reset'),readout=$('readout');
  const original={check:check.parentNode,feedback:feedback.parentNode,reset:reset.parentNode};$('inv-check-slot').append(check);$('inv-feedback').append(feedback);feedback.tabIndex=-1;readout.classList.add('sr-only');reset.textContent='Start from the first mission';controlsRoot.querySelector('.im-bottom').append(reset);
  app.querySelector('.brand').innerHTML='<span>✦</span> MOON GARDEN / MISSION LAB';app.querySelector('.topbar .pill').textContent='A game about thinking backward';app.querySelector('.panel h2').hidden=true;
  const world=$('inv-world'),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));renderer.setClearColor('#181c38',0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Toy rocket with cargo hatch and star badge; garden beacon and two destination moons. Use the part buttons to inspect.');world.prepend(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-10,10,6,-6,.1,100);camera.position.set(0,12,23);camera.lookAt(0,1,-1);
  scene.add(new THREE.HemisphereLight('#e9eaff','#7279b8',3.4));const sun=new THREE.DirectionalLight('#ffe1c5',4.3);sun.position.set(-9,14,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:50});sun.shadow.normalBias=.04;scene.add(sun);const rim=new THREE.DirectionalLight('#72ffe0',2.6);rim.position.set(10,8,-6);scene.add(rim);
  const objects=makeMissionWorld(scene),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let observed=null,disposed=false,paintFrame=null,animation=null,primaryAction=null,lastPhase=null,lastRun='',progress=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const info={renderer:'threejs',extension:true,pickTargets:{},phase:'briefing',flightProgress:0,sceneSummary:'',layout:'desktop'};
  function stop(){animation?.kill();animation=null;$('inv-skip').hidden=true;}
  function queuePaint(){if(paintFrame===null&&!disposed)paintFrame=requestAnimationFrame(()=>{paintFrame=null;paint();});}
  function screen(point){const v=point.clone().project(camera);return {x:(v.x+1)/2,y:(1-v.y)/2};}
  function flightPosition(p,destination){const end=(destination==='Quiet Moon'?objects.quiet.position:objects.garden.position).clone().add(new THREE.Vector3(1.1,.08,.8)),start=objects.pad.position;return new THREE.Vector3().lerpVectors(start,end,p).add(new THREE.Vector3(0,.18+Math.sin(p*Math.PI)*.55,0));}
  function placeRocket(p){const outcome=observed?.lastFlight;objects.rocket.position.copy(flightPosition(p,outcome?.destination||'Moon Garden'));objects.rocket.rotation.z=Math.sin(p*Math.PI)*-.12;objects.rocket.scale.setScalar(1-p*.6);objects.flame.visible=p>0&&p<.98;objects.cargo.visible=!!observed?.seedsLoaded&&!!observed?.hatchOpen&&(!outcome?.spilled||p<.25);objects.spilled.visible=!!outcome?.spilled&&p>=.25;objects.spilled.children.forEach((seed,i)=>{seed.position.set(-2.8+i*.9,.9+i*.4,-.2-i*.55);seed.rotation.z=i*.4;});info.flightProgress=Number(p.toFixed(3));}
  function paint(){
    if(disposed)return;placeRocket(progress);scene.updateMatrixWorld(true);camera.updateMatrixWorld();renderer.render(scene,camera);
    for(const [id,object] of Object.entries({hatch:objects.hatchTarget,badge:objects.badge,beacon:objects.beaconTarget})){const point=new THREE.Vector3();object.getWorldPosition(point);info.pickTargets[id]=screen(point);}
    for(const [id,obj] of [['garden',objects.garden],['quiet',objects.quiet]]){const p=screen(obj.position.clone().add(new THREE.Vector3(0,-.9,1)));const label=$('inv-'+id+'-label');label.style.left=(p.x*world.clientWidth)+'px';label.style.top=(p.y*world.clientHeight)+'px';}
  }
  function resize(){
    const w=Math.max(world.clientWidth,1),h=Math.max(world.clientHeight,1),mobile=w<600,span=mobile?10.8:15.5,vertical=span*h/w;
    info.layout=mobile?'phone':'desktop';camera.left=-span/2;camera.right=span/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const layoutRay=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    function at(group,x,y){layoutRay.setFromCamera(new THREE.Vector2(x*2-1,1-y*2),camera);layoutRay.ray.intersectPlane(plane,group.position);}
    at(objects.pad,mobile?.35:.28,mobile?.82:.73);at(objects.garden,.78,.27);at(objects.quiet,mobile?.18:.13,.21);at(objects.beacon,mobile?.81:.75,.88);
    renderer.setSize(w,h,false);paint();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(world);
  function focusQuestion(){const q=$('inv-question');q.focus({preventScroll:true});q.scrollIntoView({block:'start',behavior:'instant'});}
  function action(type,value){const old=observed.phase;dispatch({type,value});if(observed.phase!==old)focusQuestion();else if(['inspect','predict','repair','conclusion'].includes(type))$('inv-primary').hidden?check.scrollIntoView({block:'nearest',behavior:'instant'}):$('inv-primary').scrollIntoView({block:'nearest',behavior:'instant'});}
  let down=null;const onDown=e=>{down={x:e.clientX,y:e.clientY};};
  const onUp=e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>8){down=null;return;}down=null;if(observed.phase!=='inspect')return;const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([objects.rocket,objects.beacon],true).find(h=>h.object.userData.part);if(hit&&(observed.mission==='challenge'||hit.object.userData.part!=='beacon'))action('inspect',hit.object.userData.part);};
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);
  controlsRoot.addEventListener('click',e=>{const button=e.target.closest('button[data-inv-action]');if(button)action(button.dataset.invAction,button.dataset.value);});
  $('inv-primary').onclick=()=>{if(primaryAction)action(...primaryAction);};$('inv-secondary').onclick=()=>action('changePart');$('inv-undo').onclick=()=>action('undo');$('inv-help').onclick=()=>action('help');$('inv-restart').onclick=()=>action('restart');$('inv-skip').onclick=()=>{stop();progress=1;paint();};
  function submitCapture(){if(observed.phase==='conclusion'&&observed.conclusion)dispatch({type:'submitConclusion'});}
  check.addEventListener('click',submitCapture,true);
  const option=(id,label,type,value,selected)=>`<button id="inv-${id}" data-inv-action="${type}" data-value="${value}" aria-pressed="${selected}">${escape(label)}</button>`;
  function render(o,time=0,{seeking=false}={}){
    const focusId=document.activeElement?.id;stop();observed=o;info.phase=o.phase;
    $('inv-stage').textContent=(o.mission==='guided'?'MISSION 1 · FIND ONE CAUSE':'MISSION 2 · TWO INDEPENDENT CAUSES');
    $('inv-parts').hidden=o.phase!=='inspect';$('inv-parts').innerHTML=(o.mission==='guided'?['hatch','badge']:systems).map(id=>option('part-'+id,name[id],'inspect',id,o.system===id)).join('');
    $('inv-status').hidden=!['result','reveal','conclusion','complete'].includes(o.phase);$('inv-comparison').hidden=true;$('inv-choices').innerHTML='';$('inv-preview').textContent='';$('inv-recap').hidden=true;check.hidden=true;$('inv-primary').hidden=false;$('inv-secondary').hidden=!['predict','repair'].includes(o.phase);$('inv-undo').hidden=o.phase!=='result'||!o.lastChange;primaryAction=null;
    let question='',instruction='',primary='';
    if(o.phase==='briefing'){question='Can we get all 3 seeds to the garden?';instruction='Watch one rehearsal. Then investigate what stopped the delivery.';primary='Run the first rehearsal →';primaryAction=['baseline'];}
    if(o.phase==='inspect'){question='What could stop the seeds reaching the garden?';instruction='Tap a part to investigate. Then confirm what you want to inspect.';primary='Predict the problem →';primaryAction=['commitInspect'];$('inv-primary').disabled=!o.system;$('inv-preview').textContent=o.system?partDescription(o):'Inspect the cargo hatch'+(o.mission==='challenge'?', garden beacon':'')+' or the rocket badge.';}
    if(o.phase==='predict'){question='What could this '+(o.system==='hatch'?'cargo bay':o.system==='beacon'?'beacon':'badge')+' cause?';instruction=partDescription(o)+' Predict its effect before changing it.';primary='Choose a change →';primaryAction=['confirmPrediction'];const ids=o.system==='hatch'?(o.seedsLoaded?(o.hatchOpen?['spill','wrong-moon']:['none','spill']):['empty','spill']):o.system==='beacon'?['wrong-moon','spill','none']:['none','spill'];$('inv-choices').innerHTML=ids.map(id=>option('predict-'+id,id==='none'&&o.system==='badge'?'It changes how the rocket looks':predictionNames[id],'predict',id,o.prediction===id)).join('');$('inv-primary').disabled=!o.prediction;}
    if(o.phase==='repair'){question='What will you change before the rehearsal?';instruction='Change one thing, then test it. Your prediction is saved; the flight will show the evidence.';primary='Run the rehearsal →';primaryAction=['rehearse'];const ids=o.system==='hatch'?(o.seedsLoaded?['seal','unload']:['load','seal']):repairs[o.system];$('inv-choices').innerHTML=ids.map(id=>option('repair-'+id,repairNames[id],'repair',id,o.repair===id)).join('');$('inv-primary').disabled=!o.repair;$('inv-preview').textContent=o.repair?'Planned change: '+repairNames[o.repair]+'.':'Choose one change. It will be applied when you run the rehearsal.';}
    if(o.phase==='result'){
      const r=o.lastFlight;question=resultTitle(r);instruction=resultDescription(r);primary=r.goalMet?(o.mission==='guided'?'How did you solve it? →':'What can we conclude? →'):(o.history.length===1?'Find the cause'+(o.mission==='challenge'?'s':'')+' →':'Change the plan →');primaryAction=[r.goalMet?(o.mission==='guided'?'reveal':'conclude'):'continue'];
      $('inv-comparison').hidden=false;
      const trace=r.empty?'No seeds loaded → no spill → no delivery':(o.hatchOpen?'Open hatch → seeds escape':'Closed hatch → seeds stay aboard')+' · '+(o.beaconOn?'Awake beacon → Moon Garden':'Sleeping beacon → Quiet Moon');
      $('inv-comparison').innerHTML='<span class="im-eyebrow">WHAT THE REHEARSAL SHOWED</span><p>'+escape(trace)+'</p>'+(o.lastPrediction?'<small>You predicted: '+escape(predictionNames[o.lastPrediction.answer])+'. Before the change: '+escape(predictionNames[o.lastPrediction.beforeCause])+'. '+(o.lastPrediction.matched?'Your prediction matched that cause.':'That cause differed from your prediction. You can revise your explanation using this result.')+'</small>':'<small>This first rehearsal is an observation, not a prediction you made.</small>');
    }
    if(o.phase==='reveal'){question='You worked backward.';instruction='You asked what could stop the delivery, then removed a cause and checked the goal.';primary='Try the next mission →';primaryAction=['nextMission'];$('inv-recap').hidden=false;$('inv-recap').innerHTML='<span class="im-eyebrow">MEET THE MENTAL MODEL</span><h3>Inversion.</h3><p>Instead of only asking “How do we succeed?”, ask “What could make us fail?” Then prevent that cause—and test whether the goal happened.</p>';}
    if(o.phase==='conclusion'){question='What does a successful rehearsal tell us?';instruction='We blocked the failures in this toy mission. Choose the conclusion the evidence supports.';$('inv-choices').innerHTML=option('conclusion-limits','This rehearsal worked. A real mission could have problems we did not include.','conclusion','limits',o.conclusion==='limits')+option('conclusion-guarantee','Fixing these two things guarantees every mission will work.','conclusion','guarantee',o.conclusion==='guarantee');$('inv-primary').hidden=true;check.hidden=!o.conclusion;check.textContent='Check my conclusion →';}
    if(o.phase==='complete'){question='Mission complete. Keep asking better questions.';instruction='Goal → imagine failure → trace the cause → change the plan → test the goal.';$('inv-primary').hidden=true;$('inv-recap').hidden=false;$('inv-recap').innerHTML='<h3>Prevent failure. Still check success.</h3><p>Fixing one cause may leave another. Avoiding a spill with an empty rocket also misses the goal. A successful rehearsal tells us what worked under these rules.</p>';}
    $('inv-question').textContent=question;$('inv-instruction').textContent=instruction;$('inv-primary').textContent=primary;if(!['inspect','predict','repair'].includes(o.phase))$('inv-primary').disabled=false;
    if(o.lastFlight){$('inv-status').innerHTML='<div data-good="'+o.lastFlight.goalMet+'"><span>SEEDS AT THE GARDEN</span><strong>'+o.lastFlight.delivered+' / 3</strong></div><div data-good="'+!o.lastFlight.wrongMoon+'"><span>ROCKET DESTINATION</span><strong>'+o.lastFlight.destination+'</strong></div>';}
    $('inv-help-text').hidden=!o.usedHelp;$('inv-help-text').textContent='Work backward from the delivery goal: seeds can be lost through an open hatch, or carried to the wrong moon by a sleeping beacon. A shiny badge changes neither route. After a change, check whether seeds actually arrived.';
    objects.door.rotation.y=o.hatchOpen?-1.35:0;objects.beaconLamp.material.color.set(o.beaconOn?'#caff81':'#8c839f');objects.beaconGlow.visible=o.beaconOn;objects.badge.rotation.z=o.badgePolished?0:.35;objects.beaconRing.material.color.set(o.beaconClean?'#fff0ac':'#a4b9c3');objects.growth.visible=!!o.lastFlight?.goalMet&&['result','reveal','conclusion','complete'].includes(o.phase);
    for(const [id,ring] of Object.entries(objects.selection)){ring.visible=o.system===id&&['inspect','predict','repair'].includes(o.phase);}
    const isResult=['result','reveal','conclusion','complete'].includes(o.phase),key=o.mission+':'+o.history.length;progress=isResult?1:0;
    info.sceneSummary=partDescription({...o,system:'hatch'})+' '+partDescription({...o,system:'beacon'})+(isResult?' '+resultDescription(o.lastFlight):' The rocket is at the launch station.');renderer.domElement.setAttribute('aria-label',info.sceneSummary);
    resize();
    if(o.phase==='result'&&key!==lastRun&&!seeking&&!reduced){progress=0;const clock={p:0};$('inv-skip').hidden=false;animation=gsap.timeline({onUpdate(){progress=clock.p;queuePaint();},onComplete(){animation=null;$('inv-skip').hidden=true;progress=1;queuePaint();}}).to(clock,{p:1,duration:1.5,ease:'power1.inOut'});paint();}
    lastRun=key;lastPhase=o.phase;if(focusId&&$(focusId))$(focusId).focus({preventScroll:true});
  }
  function onAssessment(result){feedback.scrollIntoView({block:'nearest',behavior:'instant'});feedback.focus({preventScroll:true});}
  function disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.dispose();});}
  return {render,onAssessment,info,dispose(){disposed=true;stop();if(paintFrame!==null)cancelAnimationFrame(paintFrame);resizeObserver.disconnect();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);check.removeEventListener('click',submitCapture,true);disposeGroup(scene);renderer.dispose();original.check.prepend(check);original.feedback.append(feedback);original.reset.append(reset);readout.classList.remove('sr-only');app.classList.remove('inversion-game');style.remove();}};
}

function makeMissionWorld(scene){
  const cream='#fff2de',coral='#ff826e',mint='#6ce0c6',ink='#30344b',gold='#ffdc77',purple='#a895e3';
  const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.46,metalness:.03,...extra});
  function mesh(parent,geometry,color,x=0,y=0,z=0,extra={}){const m=new THREE.Mesh(geometry,material(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const box=(p,w,h,d,c,x=0,y=0,z=0)=>mesh(p,new RoundedBoxGeometry(w,h,d,3,Math.min(.12,w/3,h/3,d/3)),c,x,y,z);
  const ball=(p,r,c,x,y,z)=>mesh(p,new THREE.SphereGeometry(r,20,14),c,x,y,z);
  const cylinder=(p,rt,rb,h,c,x,y,z)=>mesh(p,new THREE.CylinderGeometry(rt,rb,h,40),c,x,y,z);
  function island(top,base,r){const g=new THREE.Group();cylinder(g,r,r*.9,.25,top,0,-.12,0);const rock=mesh(g,new THREE.IcosahedronGeometry(r,0),base,0,-.62,0);rock.scale.y=.48;scene.add(g);return g;}
  const pad=island('#c7b5f1','#8372bd',2.05),padRing=mesh(pad,new THREE.TorusGeometry(1.55,.055,8,64),cream,0,.035,0);padRing.rotation.x=-Math.PI/2;
  for(const x of [-1.15,1.15])box(pad,.4,.045,2.1,'#9c8bd1',x,.03,0);
  const rocket=new THREE.Group();scene.add(rocket);
  cylinder(rocket,.65,.78,1.9,cream,0,1.7,0);mesh(rocket,new THREE.ConeGeometry(.67,1.15,40),coral,0,3.2,0);cylinder(rocket,.78,.75,.23,coral,0,.71,0);cylinder(rocket,.4,.55,.4,ink,0,.42,0);
  for(const x of [-.8,.8]){const fin=box(rocket,.3,.95,.9,mint,x,.8,0);fin.rotation.z=x>0?-.24:.24;}
  const rim=cylinder(rocket,.32,.32,.12,mint,0,2.48,.64);rim.rotation.x=Math.PI/2;const window=ball(rocket,.25,ink,0,2.48,.71);window.scale.z=.2;
  box(rocket,.9,1.02,.08,ink,0,1.45,.77);
  const cargo=new THREE.Group();cargo.position.set(0,1.28,.85);rocket.add(cargo);
  for(const [i,x]of[-.25,0,.25].entries()){const seed=ball(cargo,.15,gold,x,i%2*.23,0);seed.material.emissive=new THREE.Color('#f8ba4a');seed.material.emissiveIntensity=.3;box(cargo,.045,.2,.035,mint,x,.17+i%2*.23,0);}
  const door=new THREE.Group();door.position.set(-.49,1.45,.85);rocket.add(door);box(door,.98,1.04,.12,coral,.49,0,0);box(door,.16,.06,.06,gold,.78,0,.09);
  const hatchTarget=new THREE.Object3D();hatchTarget.position.set(0,1.5,1.05);rocket.add(hatchTarget);
  rocket.traverse(o=>{if(o.isMesh)o.userData.part='hatch';});
  const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.13:.28;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)starShape.moveTo(x,y);else starShape.lineTo(x,y);}starShape.closePath();
  const badge=mesh(rocket,new THREE.ExtrudeGeometry(starShape,{depth:.08,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,steps:1}),gold,.47,2.15,.74);badge.userData.part='badge';
  const flame=mesh(rocket,new THREE.ConeGeometry(.27,.7,18),gold,0,-.08,0,{emissive:'#ff7a32',emissiveIntensity:.5});flame.rotation.z=Math.PI;flame.visible=false;
  const beacon=new THREE.Group();scene.add(beacon);cylinder(beacon,.68,.8,.25,purple,0,.04,0);cylinder(beacon,.12,.18,1.2,cream,0,.68,0);const dish=mesh(beacon,new THREE.SphereGeometry(.6,24,12,0,Math.PI*2,0,Math.PI*.5),mint,0,1.25,0);dish.rotation.x=-.4;
  const beaconLamp=ball(beacon,.25,gold,0,1.65,.2),beaconRing=mesh(beacon,new THREE.TorusGeometry(.5,.065,8,32),'#a4b9c3',0,1.48,.08);beaconRing.rotation.x=Math.PI/2;
  const beaconGlow=new THREE.Group();beaconGlow.scale.setScalar(.7);beacon.add(beaconGlow);for(const r of [.6,.88,1.12]){const arc=mesh(beaconGlow,new THREE.TorusGeometry(r,.027,6,36,Math.PI*.9),'#caff81',0,1.9,.03,{emissive:'#caff81',emissiveIntensity:.5});arc.rotation.z=.15;}
  const beaconTarget=new THREE.Object3D();beaconTarget.position.set(0,1.6,.2);beacon.add(beaconTarget);beacon.traverse(o=>{if(o.isMesh)o.userData.part='beacon';});
  const garden=island('#89e7d0','#439986',1.55);cylinder(garden,1.15,1.22,.12,cream,0,.09,0);mesh(garden,new THREE.SphereGeometry(1.13,32,18,0,Math.PI*2,0,Math.PI/2),'#adf4e3',0,.15,0,{transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide});
  const growth=new THREE.Group();garden.add(growth);for(const [i,x]of[-.6,0,.6].entries()){cylinder(growth,.04,.06,.65,mint,x,.48,0);const leaf=ball(growth,.24,'#a2ee73',x-.14,.7,.04);leaf.scale.set(1,.5,.55);const leaf2=ball(growth,.24,mint,x+.13,.52,.04);leaf2.scale.set(1,.5,.55);ball(growth,.22,i%2?'#ff96bf':gold,x,.99,0);}growth.visible=false;
  const quiet=island('#b5aec5','#716d89',1.2);for(const [x,z,r]of[[.3,.2,.28],[-.4,-.2,.2],[.2,-.6,.14]]){const crater=mesh(quiet,new THREE.TorusGeometry(r,.065,8,24),'#9189a4',x,.04,z);crater.rotation.x=-Math.PI/2;}
  const spilled=new THREE.Group();scene.add(spilled);for(let i=0;i<3;i++){const seed=ball(spilled,.19,gold,-2.8+i*.9,.9+i*.4,-.2-i*.55);seed.material.emissive=new THREE.Color('#ffc561');seed.material.emissiveIntensity=.5;}spilled.visible=false;
  const selection={};for(const [id,parent,r]of[['hatch',rocket,1.12],['badge',rocket,.4],['beacon',beacon,.9]]){const ring=mesh(parent,new THREE.TorusGeometry(r,.045,8,40),'#fce69a',id==='badge'?.47:0,id==='badge'?2.15:.2,id==='badge'?.88:0,{emissive:'#ecca6b',emissiveIntensity:.25});if(id!=='badge')ring.rotation.x=-Math.PI/2;ring.visible=false;selection[id]=ring;}
  const stars=new THREE.Group();scene.add(stars);for(let i=0;i<32;i++){const star=mesh(stars,new THREE.OctahedronGeometry(i%7===0?.08:.035),i%3===0?gold:'#d2c4ff',Math.sin(i*2.4)*12,3+(i%6)*.65,-9-(i%3));star.castShadow=false;}
  return {pad,rocket,door,cargo,badge,hatchTarget,flame,beacon,beaconTarget,beaconLamp,beaconRing,beaconGlow,garden,quiet,growth,spilled,selection};
}

const styles=`
body:has(.inversion-game){background:#11152b;color:#f8f5ff}.inversion-game{max-width:1100px;padding:23px 30px;font-family:"Avenir Next",ui-rounded,system-ui,sans-serif}.inversion-game .topbar{margin-bottom:26px}.inversion-game .brand{font-size:12px;letter-spacing:.1em}.inversion-game .brand span{width:24px;height:24px;text-align:center;line-height:24px;background:#ffad8c;color:#332f4b}.inversion-game .pill{border-color:#444663;color:#c2c5dd;font-size:11px}.inversion-game #title{font-size:clamp(30px,4vw,43px);margin:0 0 10px;max-width:none}.inversion-game #prompt{font-size:15px;color:#bcc2de;margin:0 0 23px;max-width:none}.inversion-game #eyebrow,.inversion-game .lesson-nav,.inversion-game .stage-note,.inversion-game .panel>h2,.inversion-game .panel>.buttons{display:none}.inversion-game .layout{display:block}.inversion-game .stage-wrap,.inversion-game .stage{height:auto;min-height:0;overflow:visible;border:0;padding:0;display:block;background:transparent;border-radius:0}.inversion-game .panel{border:0;padding:0;margin:0;background:none}.inversion-game [hidden]{display:none!important}.inversion-game button{min-height:46px;font:inherit}.inversion-game button:focus-visible{outline:3px solid #f4da87;outline-offset:4px}.im-card{border-radius:25px 25px 0 0;overflow:hidden;background:#1d2345;border:1px solid #42496c;border-bottom:0}.im-question{padding:23px 26px 19px;background:#293052}.im-mission-row{display:flex;justify-content:space-between;gap:20px;align-items:center}.im-eyebrow{font-size:10px;letter-spacing:.11em;font-weight:850;color:#f0cd8a}.im-goal{font-size:9px;letter-spacing:.04em;color:#a8f0d5;background:#354862;padding:7px 9px;border-radius:9px}.im-question h2{font-size:clamp(22px,3vw,29px);line-height:1.18;letter-spacing:-.025em;margin:14px 0 9px;max-width:850px}.im-question p{font-size:14px;line-height:1.55;margin:0;color:#c3c9e0;max-width:850px}.im-world{height:390px;position:relative;background:radial-gradient(ellipse at 35% 110%,#5d4a84 0,transparent 65%),linear-gradient(#1d2345,#282e54);touch-action:pan-y}.inversion-game .im-world canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y}.im-place{position:absolute;transform:translate(-50%,0);padding:5px 10px;border-radius:9px;background:#233d4dde;color:#c4ffe7;font-size:10px;white-space:nowrap;pointer-events:none}.im-place.im-quiet{background:#33344cce;color:#c9c5dc}.im-caption{font-size:10px;color:#abb2d1;text-align:center;padding:0 12px 15px;margin:0}.im-panel{border:1px solid #42496c;border-top:0;background:#1d2345;padding:0 26px 24px;border-radius:0 0 25px 25px}.im-parts,.im-choices{display:flex;gap:11px}.inversion-game .im-parts button,.inversion-game .im-choices button{flex:1;border:1px solid #626a89;border-radius:14px;background:#303859;color:#e6eafa;padding:13px 17px;font-size:14px;line-height:1.4;min-width:0;text-align:left}.inversion-game .im-parts button[aria-pressed=true],.inversion-game .im-choices button[aria-pressed=true]{background:#ffe0ac;border-color:#ffd08a;color:#332a38}.im-preview{font-size:13px;line-height:1.5;color:#d4d8ea;margin:14px 0}.im-preview:empty{display:none}.im-actions{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:19px}.inversion-game .im-primary,.inversion-game #check{font-weight:800;background:#ffd08a;color:#29263e;padding:14px 23px;border:0;border-radius:14px;font-size:14px;min-height:50px}.inversion-game .im-primary:disabled{opacity:.48;cursor:default}.inversion-game .im-link,.inversion-game #reset{background:none;border:0;color:#b7c0df;font-size:12px;padding:8px 0;text-align:left}.im-bottom{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin:17px 0}.im-status{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:17px}.im-status>div{border:1px solid #8d6a77;background:#493544;border-radius:15px;padding:15px 18px}.im-status>div[data-good=true]{background:#2c493e;border-color:#5c8970}.im-status span{display:block;font-size:9px;font-weight:800;color:#dfc7d0;letter-spacing:.06em}.im-status strong{display:block;font-size:23px;margin-top:5px;letter-spacing:-.02em}.im-status [data-good=true] span{color:#b3e7c9}.im-comparison{padding:16px 19px;background:#303755;border-radius:15px;margin-top:17px;font-size:14px;line-height:1.6}.im-comparison p{margin:9px 0}.im-comparison small{font-size:12px;color:#c0c8e0;display:block;line-height:1.65}.im-recap{background:#f4ebd9;color:#383344;border-radius:19px;padding:22px 25px;margin-top:17px}.im-recap h3{font-size:31px;letter-spacing:-.04em;margin:8px 0 12px}.im-recap p{font-size:15px;line-height:1.6;margin:7px 0}.im-recap .im-eyebrow{color:#80633e}.inversion-game .feedback{min-height:0;font-size:14px;line-height:1.6;padding-top:0;color:#f0d9b0}.inversion-game .feedback:not(:empty){padding:18px 0 0}.inversion-game .feedback[data-correct=true]{color:#b8f0ce}.im-discuss,.inversion-game .explain{color:#a7b1d0;border-top:1px solid #39425f;padding-top:16px;font-size:12px;line-height:1.65;margin-top:19px}.im-discuss summary{cursor:pointer;font-weight:750}.im-hint{font-size:13px;line-height:1.65;background:#303857;border-radius:15px;padding:17px;color:#d6dff7}.inversion-game .footer{font-size:10px;color:#8390b4}.im-world>button{position:absolute;bottom:12px;right:17px;background:#ffe3b4;color:#322c40;border:0;font-size:11px;padding:9px 15px;border-radius:12px}
@media(max-width:650px){.inversion-game{padding:17px 14px}.inversion-game .pill{display:none}.inversion-game .brand{font-size:10px}.inversion-game .topbar{margin-bottom:22px}.inversion-game #title{font-size:32px}.inversion-game #prompt{font-size:14px;line-height:1.55;margin-bottom:18px}.im-question{padding:19px 17px}.im-mission-row{display:block}.im-goal{display:inline-block;margin-top:10px;font-size:8px}.im-eyebrow{font-size:9px}.im-question h2{font-size:23px;margin-top:14px}.im-question p{font-size:13px}.im-world{height:310px}.im-panel{padding:0 15px 21px}.im-parts,.im-choices{gap:7px}.inversion-game .im-parts button{font-size:12px;padding:10px 8px;text-align:center}.im-choices{flex-direction:column}.inversion-game .im-choices button{font-size:13px;padding:13px 15px}.im-actions{gap:10px 17px}.inversion-game .im-primary,.inversion-game #check{width:100%;font-size:13px;padding:14px 17px}.im-actions>div{width:100%}.im-status{gap:8px}.im-status>div{padding:13px 12px}.im-status span{font-size:8px}.im-status strong{font-size:19px}.im-comparison{font-size:13px;padding:14px 15px}.im-recap{padding:21px 19px}.im-recap h3{font-size:28px}.im-bottom{gap:12px}.im-place{font-size:8px;padding:4px 7px}.im-caption{font-size:9px}.im-preview{font-size:12px}}
`;

const event=(type,value)=>({type,...(value===undefined?{}:{value})});
const investigate=(part,prediction,repair)=>[event('inspect',part),event('commitInspect'),event('predict',prediction),event('confirmPrediction'),event('repair',repair),event('rehearse')];
const first=[event('baseline'),event('continue')];
const guidedWin=[...first,...investigate('hatch','spill','seal')];
const challengeStart=[...guidedWin,event('reveal'),event('nextMission')];
const challengeWin=[...challengeStart,event('continue'),...investigate('hatch','spill','seal'),event('continue'),...investigate('beacon','wrong-moon','wake')];
plugin.fixtures=[
  {actions:[event('baseline')],expectedObservation:{lastFlight:{delivered:0,spilled:true,empty:false,wrongMoon:false,destination:'Moon Garden',goalMet:false,failures:['spill']}},expectedCorrect:false},
  {actions:guidedWin,expectedObservation:{goalMet:true,knownFailureCount:0,phase:'result'},expectedCorrect:false},
  {actions:[...first,...investigate('hatch','wrong-moon','seal')],expectedObservation:{goalMet:true,lastPrediction:{system:'hatch',answer:'wrong-moon',beforeCause:'spill',matched:false}},expectedCorrect:false},
  {actions:[...first,...investigate('hatch','spill','unload')],expectedObservation:{lastFlight:{delivered:0,spilled:false,empty:true,wrongMoon:false,destination:'Moon Garden',goalMet:false,failures:['empty']}},expectedCorrect:false},
  {actions:[...first,...investigate('badge','none','polish')],expectedObservation:{badgePolished:true,hatchOpen:true,goalMet:false,knownFailureCount:1}},
  {actions:challengeStart,expectedObservation:{phase:'result',mission:'challenge',knownFailureCount:2,hatchOpen:true,beaconOn:false}},
  {actions:[...challengeStart,event('continue'),...investigate('hatch','spill','seal')],expectedObservation:{lastFlight:{delivered:0,spilled:false,empty:false,wrongMoon:true,destination:'Quiet Moon',goalMet:false,failures:['wrong-moon']}},expectedCorrect:false},
  {actions:[...challengeStart,event('continue'),...investigate('beacon','wrong-moon','wake')],expectedObservation:{lastFlight:{delivered:0,spilled:true,empty:false,wrongMoon:false,destination:'Moon Garden',goalMet:false,failures:['spill']}},expectedCorrect:false},
  {actions:[...challengeStart,event('continue'),...investigate('beacon','wrong-moon','clean')],expectedObservation:{beaconClean:true,beaconOn:false,knownFailureCount:2,goalMet:false}},
  {actions:challengeWin,expectedObservation:{mission:'challenge',goalMet:true,knownFailureCount:0}},
  {actions:[...challengeWin,event('conclude'),event('conclusion','guarantee'),event('submitConclusion')],expectedObservation:{phase:'conclusion',conclusionSubmitted:true},expectedCorrect:false},
  {actions:[...challengeWin,event('conclude'),event('conclusion','limits'),event('submitConclusion')],expectedObservation:{phase:'complete',goalMet:true},expectedCorrect:true}
];
const clicksFor=(part,prediction,repair)=>['#inv-part-'+part,'#inv-primary','#inv-predict-'+prediction,'#inv-primary','#inv-repair-'+repair,'#inv-primary'].map(selector=>({action:'click',selector}));
plugin.acceptance=[
  {action:'click',selector:'#inv-primary'}, {action:'assert_text',selector:'#inv-question',text:'Right moon. No seeds.'},
  {action:'click',selector:'#inv-primary'},...clicksFor('hatch','spill','seal'),
  {action:'assert_observed',field:'goalMet',value:true},
  {action:'click',selector:'#inv-primary'},{action:'assert_text',selector:'#inv-recap',text:'Inversion'},
  {action:'click',selector:'#inv-primary'},{action:'click',selector:'#inv-primary'},...clicksFor('hatch','spill','seal'),
  {action:'assert_text',selector:'#inv-question',text:'Seeds safe. Wrong moon.'},
  {action:'click',selector:'#inv-primary'},...clicksFor('beacon','wrong-moon','wake'),
  {action:'click',selector:'#inv-primary'},{action:'click',selector:'#inv-conclusion-limits'}
];
