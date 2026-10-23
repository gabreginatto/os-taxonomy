import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {gsap} from 'gsap';

// Pure resources and preference rules; animations never decide the answer.
const adventures=[
  {id:'robot',title:'Build a robot',benefit:'the fun of building a robot',cash:0,time:2},
  {id:'film',title:'Make a movie',benefit:'the fun of making a movie',cash:0,time:2},
  {id:'park',title:'Meet a friend',benefit:'time outdoors with a friend',cash:0,time:2}
];
const projects=[
  {id:'robot',title:'Build a robot',benefit:'building a robot',cash:8,time:0},
  {id:'film',title:'Make a movie',benefit:'making a movie',cash:10,time:0},
  {id:'garden',title:'Garden lab',benefit:'growing a garden experiment',cash:6,time:0},
  {id:'observatory',title:'Telescope visit',benefit:'exploring the night sky',cash:12,time:0}
];
const rounds={personal:{cash:0,time:2,options:adventures,order:[]},budget:{cash:10,time:0,options:projects,order:['observatory','film','garden']},tighter:{cash:9,time:0,options:projects,order:['observatory','film','garden']}};
const fresh=(round='personal')=>({round,candidate:null,selected:round==='personal'?null:'robot',alternative:null,usedHelp:false});
function observe(state){
  const r=rounds[state.round],options=r.options.map(o=>({...o,feasible:o.cash<=r.cash&&o.time<=r.time}));
  const chosen=options.find(o=>o.id===state.selected)||null,alternative=options.find(o=>o.id===state.alternative)||null;
  const available=options.filter(o=>o.feasible&&o.id!==state.selected);
  const bestAlternativeIds=state.round==='personal'?(alternative?[alternative.id]:[]):r.order.filter(id=>available.some(o=>o.id===id)).slice(0,1);
  return {...state,cash:r.cash,time:r.time,options,chosen,alternativeOption:alternative,
    phase:!chosen?(state.candidate?'confirm-choice':'choose'):!alternative?'alternative':'compare',bestAlternativeIds,leftCash:chosen?r.cash-chosen.cash:null,
    preferenceSource:state.round==='personal'?'learner_stated':'fictional_character',
    label:!chosen?'Choose one adventure for your two-hour afternoon.':!alternative?'Imagine your first choice is unavailable. What would you do instead?':'Compare your choice with the best other option.'};
}
function assess(state){
  const o=observe(state),finish=(correct,message)=>({correct,message,scope:'this_response_only',assessed:state.round!=='personal',meaning:state.round==='personal'?'valid_preference_pair':'authored_alternative_check',kind:state.round==='personal'?'preference_elicitation':'best_feasible_alternative',assistance:state.usedHelp?'worked_example_used':'help_not_requested'});
  if(!o.chosen)return finish(false,'Choose and confirm the adventure you want to do first.');
  if(!o.alternativeOption)return finish(false,'Choose what you would do instead.');
  if(state.alternative===state.selected)return finish(false,'Compare the chosen plan with a different option.');
  if(!o.alternativeOption.feasible)return finish(false,o.alternativeOption.title+' costs £'+o.alternativeOption.cash+', but Leah had £'+o.cash+' before choosing. An option she could not afford is not an opportunity she gave up. Try another.');
  if(state.round==='personal')return finish(true,'You chose '+o.chosen.title.toLowerCase()+'. You said your next choice would be '+o.alternativeOption.title.toLowerCase()+'. The value of that missed experience is your opportunity cost. These are your preferences; there is no single right favourite.');
  if(!o.bestAlternativeIds.includes(state.alternative))return finish(false,'That plan fits, but Leah would rather make a movie. Her best affordable alternative uses the original £'+o.cash+', before she pays for the robot. Try the movie.');
  return finish(true,state.round==='budget'?'The movie was affordable with the original £10. By choosing the robot, Leah gives up the value of making that movie. The £2 left over does not decide what she could have chosen instead.':'With only £9 originally, the £10 movie is unavailable. The garden experiment, with £3 kept saved, is now her best alternative. Same robot choice, different opportunity cost.');
}
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const plugin={
  id:'opportunity-cost-lab',version:'3.0.0',topicIds:['mt_Qzbh-_v0Gq'],representation:'threejs',audienceLabel:'Discover, then challenge · ages 10 & 15',
  title:'One afternoon. Three adventures.',prompt:'You have 2 free hours. Each adventure takes the whole afternoon. You can do only one.',
  reason:'Requested colorful Three.js toys stay in fixed positions through a staged choice, rewind and comparison. One question at a time makes the chosen benefit and forgone opportunity visible. GSAP handles presentation only.',
  coverage:[{index:0,mode:'partial',assessed_subclaim:'Inspect a £10 budget, an £8 complete plan and £2 saved; not a multi-item spending plan or budget-definition assessment.'},{index:2,mode:'partial',assessed_subclaim:'Identify a best feasible forgone plan in a stated fictional preference order. Personal preferences are elicited rather than graded.'}],
  assumptions:[
    'Each option is one complete, mutually exclusive plan for the same afternoon or project slot. Only the shown options are compared.',
    'The personal opener uses three free two-hour activities. Favourite and next favourite are stated by the learner, not inferred or marked objectively correct.',
    'Opportunity cost is the value of the best feasible alternative forgone. An activity names the benefit missed; it is not an additional cash payment.',
    'Leah already chose the £8 robot. The challenge identifies its opportunity cost, not whether the robot maximizes her preferences.',
    'Leah ranks alternative complete plans telescope, movie, garden. Saved cash is included in each whole plan and already reflected in the stipulated preference order. No universal or numerical utility is claimed.',
    'Affordability uses original £10 or £9, not cash left after the robot purchase.',
    'Age and reported IQ do not establish prerequisites. Comparing whole-number money and finite time are assumed.',
    'The personal reveal is a worked explanation. Fictional challenges check this response only. Neither establishes mental-model mastery.',
    'Local Munger attribution relies on an unauthenticated transcript mirror. No Munger quote or invention claim is made. No economist or learner review has been performed.'
  ],
  sources:['https://github.com/gabreginatto/os-taxonomy/blob/main/data/topics.json','Munger_Models/mental-models.json#opportunity-cost','Munger_Models/course-guidelines.md'],
  contentReview:{status:'source_reviewed',reviewer:'Codex implementation with Astra game-design consultation',scope:'Exact taxonomy foundation, local course research, counterfactual examples and model boundaries. Expert and learner reviews remain separate.'},
  scenario:[{time:1,action:{type:'preview',value:'robot'}},{time:2,action:{type:'commit'}},{time:3,action:{type:'alternative',value:'film'}}],
  fixtures:[
    {actions:[{type:'preview',value:'robot'}],expectedObservation:{phase:'confirm-choice',selected:null,candidate:'robot'},expectedCorrect:false},
    {actions:[{type:'preview',value:'robot'},{type:'commit'},{type:'alternative',value:'film'}],expectedObservation:{phase:'compare',bestAlternativeIds:['film'],preferenceSource:'learner_stated'},expectedCorrect:true},
    {actions:[{type:'preview',value:'film'},{type:'commit'},{type:'alternative',value:'park'}],expectedObservation:{bestAlternativeIds:['park']},expectedCorrect:true},
    {actions:[{type:'round',value:'budget'},{type:'alternative',value:'film'}],expectedObservation:{cash:10,leftCash:2,bestAlternativeIds:['film']},expectedCorrect:true},
    {actions:[{type:'round',value:'budget'},{type:'alternative',value:'garden'}],expectedObservation:{bestAlternativeIds:['film']},expectedCorrect:false},
    {actions:[{type:'round',value:'budget'},{type:'alternative',value:'observatory'}],expectedObservation:{cash:10},expectedCorrect:false},
    {actions:[{type:'round',value:'tighter'},{type:'alternative',value:'film'}],expectedObservation:{cash:9,leftCash:1,bestAlternativeIds:['garden']},expectedCorrect:false},
    {actions:[{type:'round',value:'tighter'},{type:'alternative',value:'garden'}],expectedObservation:{cash:9,leftCash:1,bestAlternativeIds:['garden']},expectedCorrect:true},
    {actions:[{type:'preview',value:'robot'},{type:'commit'},{type:'alternative',value:'film'},{type:'back'}],expectedObservation:{phase:'alternative',alternative:null},expectedCorrect:false},
    {actions:[{type:'round',value:'budget'},{type:'alternative',value:'film'},{type:'round',value:'tighter'}],expectedObservation:{alternative:null,bestAlternativeIds:['garden'],usedHelp:false},expectedCorrect:false}
  ],
  acceptance:[{action:'click',selector:'#oc-plan-robot'},{action:'click',selector:'#oc-commit'},{action:'assert_text',selector:'#oc-instruction',text:'If the robot adventure were unavailable'},{action:'click',selector:'#oc-plan-film'},{action:'assert_observed',field:'alternative',value:'film'},{action:'assert_text',selector:'#oc-comparison',text:'Make a movie'}],
  initialState(){return fresh();},
  applyAction(state,{type,value}){
    const r=rounds[state.round];
    if(type==='round'&&rounds[value])return fresh(value);
    if(type==='preview'&&state.round==='personal'&&!state.selected&&adventures.some(o=>o.id===value))return {...state,candidate:value};
    if(type==='commit'&&state.candidate&&!state.selected)return {...state,selected:state.candidate,candidate:null};
    if(type==='alternative'&&state.selected&&value!==state.selected&&r.options.some(o=>o.id===value))return {...state,alternative:value};
    if(type==='back')return state.alternative?{...state,alternative:null}:state.round==='personal'?fresh():state;
    if(type==='restart')return fresh(state.round);
    if(type==='help')return {...state,usedHelp:true};
    throw Error('Unsupported opportunity-cost action or value');
  },
  observe,assess,
  validateInvariants(state){
    const r=rounds[state.round];if(!r||typeof state.usedHelp!=='boolean')return false;const has=id=>r.options.some(o=>o.id===id);
    return (state.selected===null||has(state.selected))&&(state.candidate===null||has(state.candidate))&&(!state.selected||state.candidate===null)&&(state.alternative===null||has(state.alternative))&&(state.alternative===null||state.selected!==null&&state.alternative!==state.selected)&&(state.round==='personal'||state.selected==='robot');
  },
  createPresentation
};

function createPresentation(root,{controlsRoot,dispatch}){
  const app=root.closest('.app');app.classList.add('island-lab');
  const style=document.createElement('style');style.textContent=islandStyles;root.append(style);
  const surface=document.createElement('div');surface.className='ci-surface';root.append(surface);
  surface.innerHTML=`<div class="ci-chapters" aria-label="Your journey"><span id="oc-chapter-discover">1 · Your afternoon</span><span id="oc-chapter-challenge">2 · Leah’s challenge</span><span id="oc-chapter-tighter">3 · Change one thing</span></div>
    <section class="ci-board" aria-label="Choose between 3D adventures"><div class="ci-question"><div><span class="ci-kicker" id="oc-step"></span><h2 id="oc-instruction" tabindex="-1"></h2><p id="oc-guidance"></p></div><div class="ci-resource" id="oc-resource"></div></div><div id="oc-context" class="ci-context" hidden></div><div class="ci-world" id="oc-world"></div><div id="oc-options" class="ci-options"></div><p id="oc-nudge" class="ci-nudge" role="status"></p></section>`;
  controlsRoot.innerHTML=`<div id="oc-comparison" class="ci-comparison" hidden></div><div class="ci-actions"><button id="oc-back" class="ci-text-button">Change my choice</button><div class="ci-check-slot"><button id="oc-commit" class="ci-primary" hidden>Choose this adventure →</button><div id="oc-check-slot"></div></div></div>
    <section id="oc-reveal" class="ci-reveal" aria-label="Your opportunity cost" hidden><span class="ci-kicker">THAT MISSED OPPORTUNITY HAS A NAME</span><h2 id="oc-reveal-heading" tabindex="-1">Opportunity cost.</h2><p id="oc-definition"></p><p id="oc-third"></p><div id="oc-feedback-slot"></div><button id="oc-next" class="ci-primary"></button></section><div id="oc-retry" class="ci-retry" hidden></div>
    <div class="ci-bottom"><button id="oc-help" class="ci-text-button">How do I work this out?</button><button id="oc-restart" class="ci-text-button">Restart this scene</button></div><p id="oc-help-text" class="ci-help" hidden></p>
    <details class="ci-notes"><summary>Talk about a real choice</summary><p>What do you want to do this weekend? If you could not do it, what would you do instead? What would you miss about that second option?</p><p>You may value things differently from Leah or each other. In real life, compare saved money, free time, other options and uncertainty too.</p></details>`;
  const $=id=>app.querySelector('#'+id),check=$('check'),feedback=$('feedback'),reset=$('reset'),readout=$('readout');
  const original={check:check.parentNode,feedback:feedback.parentNode,reset:reset.parentNode};
  $('oc-check-slot').append(check);$('oc-feedback-slot').append(feedback);feedback.tabIndex=-1;reset.textContent='Start from the beginning';controlsRoot.querySelector('.ci-bottom').append(reset);readout.classList.add('sr-only');
  app.querySelector('.brand').innerHTML='<span>✦</span> CHOICE ISLANDS';app.querySelector('.topbar .pill').textContent='A little world. A big idea.';app.querySelector('.panel h2').hidden=true;
  const world=$('oc-world'),renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor('#c4b0f7');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Colorful 3D adventures. Tap a toy or its button below.');world.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-9,9,5,-5,.1,80);camera.position.set(0,15,23);camera.lookAt(0,.4,0);scene.add(new THREE.HemisphereLight('#fff8ff','#7163a2',3));
  const sun=new THREE.DirectionalLight('#fff0d2',4);sun.position.set(-8,18,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:10,bottom:-10,near:1,far:50});sun.shadow.normalBias=.04;scene.add(sun);
  const rim=new THREE.DirectionalLight('#83ffe3',2);rim.position.set(10,8,-5);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshBasicMaterial({color:'#c4b0f7',toneMapped:false}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.6;scene.add(floor);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({color:'#574183',opacity:.18}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.59;shadow.receiveShadow=true;scene.add(shadow);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const info={renderer:'threejs',extension:true,objects:0,pickTargets:{},objectBounds:{},phase:'choose',revealed:false};let observed=null,islands=[],lastRound=null,frame=null,disposed=false;const tweens=new Set();
  function disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.dispose();});}
  function stopTweens(){for(const t of tweens)t.kill();tweens.clear();}
  function paint(){if(disposed)return;scene.updateMatrixWorld(true);camera.updateMatrixWorld();renderer.render(scene,camera);for(const island of islands){const p=new THREE.Vector3(0,1.5,0).applyMatrix4(island.group.matrixWorld).project(camera);info.pickTargets[island.id]={x:(p.x+1)/2,y:(1-p.y)/2};const bounds=new THREE.Box3().setFromObject(island.group),corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z).project(camera));info.objectBounds[island.id]={left:Math.min(...corners.map(p=>(p.x+1)/2)),right:Math.max(...corners.map(p=>(p.x+1)/2)),top:Math.min(...corners.map(p=>(1-p.y)/2)),bottom:Math.max(...corners.map(p=>(1-p.y)/2))};}}
  function schedulePaint(){if(frame===null&&!disposed)frame=requestAnimationFrame(()=>{frame=null;paint();});}
  function resize(){const w=Math.max(1,world.clientWidth),h=Math.max(1,world.clientHeight);camera.updateMatrixWorld();const ys=[];for(const y of [-1.7,3.5])for(const z of [-2,2])ys.push(new THREE.Vector3(0,y,z).applyMatrix4(camera.matrixWorldInverse).y);const min=Math.min(...ys)-.2,max=Math.max(...ys)+.2,span=Math.max(observed?.options.length===4?19.5:15,(max-min)*w/h),vertical=span*h/w,center=(min+max)/2;camera.left=-span/2;camera.right=span/2;camera.top=center+vertical/2;camera.bottom=center-vertical/2;camera.updateProjectionMatrix();renderer.setSize(w,h,false);const worldLeft=world.getBoundingClientRect().left;for(const island of islands){const b=island.button.getBoundingClientRect();island.group.position.x=((b.left+b.width/2-worldLeft)/w-.5)*span;}paint();}
  const observer=new ResizeObserver(resize);observer.observe(world);
  function buildWorld(o){
    stopTweens();for(const i of islands){scene.remove(i.group);disposeGroup(i.group);}islands=[];$('oc-options').replaceChildren();
    for(const [index,option] of o.options.entries()){
      const color=palette[index],group=new THREE.Group();group.position.x=(index-(o.options.length-1)/2)*4.65;
      const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1.45),new THREE.MeshStandardMaterial({color:color.base,flatShading:true,roughness:.8}));rock.position.y=-.8;rock.scale.y=.65;group.add(rock);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(1.65,1.5,.28,40),new THREE.MeshStandardMaterial({color:color.top,roughness:.7}));top.receiveShadow=true;group.add(top);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.78,.095,8,60),new THREE.MeshBasicMaterial({color:'#c7ff79'}));ring.rotation.x=-Math.PI/2;ring.position.y=.19;ring.visible=false;group.add(ring);
      const toy=makeToy(option.id,color);toy.position.y=.19;group.add(toy);group.traverse(m=>{if(m.isMesh){m.castShadow=true;m.userData.optionId=option.id;}});scene.add(group);
      const button=document.createElement('button');button.id='oc-plan-'+option.id;button.className='ci-option';button.innerHTML=`<strong>${esc(option.title)}</strong><span class="ci-option-cost"></span><small class="ci-option-status"></small>`;button.onclick=()=>pick(option.id);$('oc-options').append(button);islands.push({id:option.id,group,toy,ring,button});
    }
    info.objects=islands.length;$('oc-options').style.setProperty('--count',o.options.length);resize();
  }
  function revealInView(element){element.focus({preventScroll:true});element.scrollIntoView({block:'nearest',behavior:'instant'});}
  function questionInView(){const heading=$('oc-instruction');heading.focus({preventScroll:true});$('oc-step').scrollIntoView({block:'start',behavior:'instant'});}
  function pick(id){if(!observed)return;if(!observed.selected){dispatch({type:'preview',value:id});$('oc-commit').scrollIntoView({block:'nearest',behavior:'instant'});return;}if(id===observed.selected){$('oc-nudge').textContent='That is the chosen adventure. Tap a different one to say what you would do instead.';return;}dispatch({type:'alternative',value:id});check.scrollIntoView({block:'nearest',behavior:'instant'});}
  let down=null;
  function onDown(e){down={x:e.clientX,y:e.clientY};}
  function onUp(e){if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>8){down=null;return;}down=null;const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(islands.map(i=>i.group),true).find(h=>h.object.userData.optionId);if(hit)pick(hit.object.userData.optionId);}
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);
  $('oc-commit').onclick=()=>{dispatch({type:'commit'});questionInView();};$('oc-back').onclick=()=>{dispatch({type:'back'});questionInView();};$('oc-restart').onclick=()=>{dispatch({type:'restart'});questionInView();};$('oc-help').onclick=()=>dispatch({type:'help'});$('oc-next').onclick=()=>{dispatch({type:'round',value:observed.round==='personal'?'budget':observed.round==='budget'?'tighter':'personal'});questionInView();};
  const short={robot:'the robot adventure',film:'the movie adventure',park:'meeting your friend'};
  function render(o,time=0,{seeking=false}={}){
    observed=o;info.phase=o.phase;info.revealed=false;stopTweens();if(o.round!==lastRound){lastRound=o.round;buildWorld(o);}
    const personal=o.round==='personal',selected=o.chosen,alt=o.alternativeOption;
    $('title').textContent=personal?'One afternoon. Three adventures.':o.round==='budget'?'What did Leah give up?':'Same choice. Smaller budget.';
    $('prompt').textContent=personal?'You have 2 free hours. Each adventure takes the whole afternoon. You can do only one.':o.round==='budget'?'Leah has £10 and one science-fair project slot. She has chosen the £8 robot.':'Leah now starts with £9. She still chooses the £8 robot. What changes?';
    for(const [id,active]of[['discover',personal],['challenge',o.round==='budget'],['tighter',o.round==='tighter']])$('oc-chapter-'+id).setAttribute('aria-current',active?'step':'false');
    $('oc-step').textContent=personal?(!selected?'STEP 1 OF 3 · CHOOSE':!alt?'STEP 2 OF 3 · IMAGINE':'STEP 3 OF 3 · COMPARE'):'REWIND TO BEFORE THE CHOICE';
    $('oc-instruction').textContent=personal?(!selected?'Which would you most like to do?':'If '+short[o.selected]+' were unavailable, what would you do instead?'):'Which other plan would Leah most want and be able to afford?';
    $('oc-guidance').textContent=personal?(!selected?'Tap a toy, then confirm your adventure. It’s your choice.':'Imagine you have your full 2 hours again. Choose your next favourite.'):"Use her original £"+o.cash+". Don’t try to buy another plan with the leftovers.";
    $('oc-resource').innerHTML=personal?'<span>YOUR AFTERNOON</span><strong>2 hours</strong><small>Every adventure is free</small>':'<span>BEFORE CHOOSING</span><strong>£'+o.cash+'</strong><small>After robot: £'+o.leftCash+' saved</small>';
    $('oc-context').hidden=personal;$('oc-context').innerHTML=personal?'':'<div><strong>Leah’s alternative wish list</strong><span>Most wanted first · compare the whole plans, including money saved</span></div><ol><li>Telescope visit <b>£12 · over budget</b></li><li>Make a movie <b>£10'+(o.cash<10?' · over budget':' · affordable')+'</b></li><li>Garden lab <b>£6 · affordable</b></li></ol>';
    $('oc-nudge').textContent=!selected?(o.candidate?'Preview: '+o.options.find(p=>p.id===o.candidate).title+'. Confirm below, or tap a different toy.':'One afternoon means one adventure.') :!alt?(personal?'Your first choice stays green. Pick the other adventure you would most want.':'The robot is already chosen. Tap another plan to test your answer.'):'Preview your comparison below. You can tap another alternative before revealing.';
    const benefit=option=>esc(option.benefit)+(personal?'':' · £'+(o.cash-option.cash)+' saved');
    $('oc-comparison').hidden=!alt;$('oc-comparison').innerHTML=alt?'<div class="ci-chosen"><span>'+(personal?'YOUR CHOICE':'LEAH CHOOSES')+'</span><strong>'+esc(selected.title)+'</strong><small>'+benefit(selected)+'</small></div><div class="ci-other"><span>'+(personal?'YOUR NEXT CHOICE':'PROPOSED ALTERNATIVE')+'</span><strong>'+esc(alt.title)+'</strong><small>'+(alt.feasible?benefit(alt):'Not affordable with the original £'+o.cash)+'</small></div>':'';
    check.hidden=!alt;check.textContent=personal?'Show my trade-off →':'Check this trade-off →';$('oc-commit').hidden=!o.candidate;$('oc-back').hidden=personal?o.phase==='choose':!alt;$('oc-back').textContent=alt?'Pick another alternative':o.candidate?'Clear preview':'Change my first choice';
    $('oc-reveal').hidden=true;$('oc-retry').hidden=true;$('oc-feedback-slot').append(feedback);
    $('oc-help-text').hidden=!o.usedHelp;$('oc-help-text').textContent=personal?'Imagine your first adventure is cancelled. Of the two still available, which would you enjoy more? Your preferences can differ from someone else’s.':'Worked example: cross out plans above the original £'+o.cash+'. Exclude the chosen robot. The highest affordable alternative in Leah’s list is '+(o.cash===10?'Make a movie.':'Garden lab.');
    for(const island of islands){
      const option=o.options.find(p=>p.id===island.id),chosen=island.id===o.selected,alternative=island.id===o.alternative,preview=island.id===o.candidate;
      island.button.setAttribute('aria-pressed',String(chosen||alternative||preview));island.button.dataset.state=chosen?'chosen':alternative?'alternative':preview?'preview':!option.feasible?'unavailable':'available';
      island.button.querySelector('.ci-option-cost').textContent=personal?'2 hours · free':'£'+option.cash;
      island.button.querySelector('.ci-option-status').textContent=chosen?'Chosen adventure':alternative?'Your proposed alternative':preview?'Preview · confirm below':!option.feasible?'Over original budget':!selected?'Tap to preview':'Tap as alternative';
      island.button.setAttribute('aria-label',option.title+', '+(personal?'2 hours, free':'£'+option.cash)+(chosen?', chosen':!option.feasible?', over budget':''));
      const height=chosen?.45:alternative?.23:preview?.15:0;island.group.position.y=height;island.toy.rotation.set(0,chosen?-.12:alternative?.12:0,0);island.group.scale.setScalar(!option.feasible?.87:1);island.ring.visible=chosen||alternative||preview;island.ring.material.color.set(alternative?'#ff729e':'#c7ff79');
      if(!seeking&&!reduced&&(chosen||alternative||preview)){const t=gsap.fromTo(island.group.position,{y:height-.12},{y:height,duration:.38,ease:'power2.out',onUpdate:schedulePaint});tweens.add(t);}
    }
    resize();
  }
  function onAssessment(result){
    if(!result.correct){$('oc-retry').hidden=false;$('oc-retry').append(feedback);revealInView(feedback);return;}
    info.revealed=true;stopTweens();for(const island of islands)island.group.position.y=island.id===observed.selected?.45:island.id===observed.alternative?.23:0;
    check.hidden=true;$('oc-reveal').hidden=false;$('oc-retry').hidden=true;$('oc-feedback-slot').append(feedback);
    const personal=observed.round==='personal',alt=observed.alternativeOption;$('oc-comparison').querySelector('.ci-other>span').textContent=personal?'WHAT YOU GIVE UP':'WHAT LEAH GIVES UP';
    $('oc-instruction').textContent='Here is your trade-off.';$('oc-guidance').textContent='Compare the chosen experience with the best other opportunity given up.';$('oc-step').textContent=personal?'STEP 3 OF 3 · DISCOVERED':'THE ALTERNATIVE GIVEN UP';
    $('oc-definition').innerHTML='The <strong>value of the best other option you could have chosen</strong>. Here, that means '+esc(alt.benefit)+(personal?'':', with £'+(observed.cash-alt.cash)+' kept saved')+'.';
    $('oc-third').textContent=personal?'You also miss '+observed.options.find(o=>o.id!==observed.selected&&o.id!==observed.alternative).benefit+', but you told us you prefer '+alt.benefit+'. We compare with your next-best option, not everything added together. Everything here was free: your time still had an opportunity cost.':'The robot’s cash price is £8. Its opportunity cost is the value of the best alternative Leah misses. Those answer different questions.';
    $('oc-next').textContent=personal?'Try Leah’s £10 challenge →':observed.round==='budget'?'What if she started with £9? →':'Try your own choice again ↺';$('oc-nudge').textContent='Green: the chosen adventure. Pink: the best other opportunity given up.';
    for(const island of islands)island.button.querySelector('.ci-option-status').textContent=island.id===observed.selected?'Chosen adventure':island.id===observed.alternative?'Best alternative given up':!observed.options.find(o=>o.id===island.id).feasible?'Not affordable':'Also skipped';paint();revealInView($('oc-reveal-heading'));
  }
  return {render,onAssessment,info,dispose(){disposed=true;stopTweens();if(frame!==null)cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);disposeGroup(scene);renderer.dispose();original.check.prepend(check);original.feedback.append(feedback);original.reset.append(reset);readout.classList.remove('sr-only');app.classList.remove('island-lab');style.remove();}};
}

const islandStyles=`
body:has(.island-lab){background:#19182b;color:#fbf9ff}.island-lab{max-width:1120px;padding:24px 36px 20px;font-family:"Avenir Next",ui-rounded,system-ui,sans-serif}.island-lab .topbar{margin-bottom:30px}.island-lab .brand{font-size:13px;letter-spacing:.1em}.island-lab .brand span{width:25px;height:25px;line-height:25px;text-align:center;background:#c7ff79;color:#27233a}.island-lab .pill{color:#c9c0df;border-color:#49415c;font-size:12px}.island-lab #title{font-size:clamp(32px,4.6vw,50px);line-height:1.08;max-width:none;margin:0 0 10px}.island-lab #prompt{color:#c5bdd6;font-size:17px;max-width:780px;margin:0 0 22px}.island-lab #eyebrow,.island-lab .lesson-nav,.island-lab .stage-note,.island-lab .panel>h2,.island-lab .panel>.buttons{display:none}.island-lab .layout{display:block}.island-lab .stage-wrap,.island-lab .stage{height:auto;min-height:0;border:0;border-radius:0;overflow:visible;background:transparent;padding:0;display:block}.island-lab .panel{padding:0;background:none;border:0;margin-top:14px}.island-lab [hidden]{display:none!important}.island-lab button{min-height:44px;font:inherit}.island-lab button:focus-visible{outline:3px solid #c7ff79;outline-offset:3px}.island-lab .footer{font-size:10px;color:#9e94b1}.island-lab .explain{border-color:#3c344f;color:#aea3c1;font-size:12px}.ci-chapters{display:flex;gap:22px;margin-bottom:14px;font-size:12px;color:#a39ab8}.ci-chapters [aria-current=step]{color:#d2ff99;font-weight:800}.ci-board{border-radius:25px;background:#c4b0f7;color:#302243;overflow:hidden;box-shadow:0 12px 50px #08071822}.ci-question{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;background:#e0d3ff;padding:24px 28px 18px}.ci-kicker{font-size:10px;font-weight:850;letter-spacing:.12em}.ci-question h2{font-size:clamp(21px,2.7vw,29px);line-height:1.16;letter-spacing:-.025em;margin:9px 0 8px;max-width:660px}.ci-question p{font-size:14px;line-height:1.5;margin:0;max-width:620px;color:#59446d}.ci-resource{flex-shrink:0;text-align:center;background:#f9f4ff;border-radius:15px;padding:13px 16px;min-width:140px}.ci-resource>span,.ci-resource>small{display:block;font-size:9px;line-height:1.6}.ci-resource>strong{font-size:26px;display:block;letter-spacing:-.04em}.ci-world{height:350px;position:relative;touch-action:pan-y}.island-lab .ci-world canvas{display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y}.ci-options{display:grid;grid-template-columns:repeat(var(--count),minmax(0,1fr));gap:14px;padding:0 28px}.island-lab .ci-option{padding:12px 8px;background:#fff9ff;color:#352841;border:2px solid transparent;border-radius:16px;min-width:0;box-shadow:0 5px 0 #6f579328;transition:background .15s}.ci-option strong{display:block;font-size:15px;line-height:1.25}.ci-option span{display:block;font-size:12px;margin:7px 0 5px}.ci-option small{display:block;font-size:10px;min-height:24px;line-height:1.25;color:#65556e}.island-lab .ci-option[data-state=chosen],.island-lab .ci-option[data-state=preview]{background:#d2ff99;border-color:#678d2e;color:#293d18}.island-lab .ci-option[data-state=alternative]{background:#ffc3d9;border-color:#b74470;color:#58243a}.island-lab .ci-option[data-state=unavailable]{background:#dbcbef;border:2px dashed #8e78a6}.ci-nudge{text-align:center;font-size:12px;line-height:1.5;margin:0;padding:17px 20px 20px;min-height:54px;color:#4e3d62}.ci-comparison{display:grid;grid-template-columns:1fr 1fr;gap:14px}.ci-comparison>div{border-radius:17px;border:1px solid #536d39;background:#263227;padding:17px 20px}.ci-comparison>div.ci-other{border-color:#8e4c70;background:#372337}.ci-comparison span{font-size:10px;letter-spacing:.08em;font-weight:800;color:#cbffa2}.ci-comparison .ci-other span{color:#ffb2d0}.ci-comparison strong{display:block;font-size:20px;margin:8px 0 4px}.ci-comparison small{font-size:12px;color:#c5bcd0}.ci-actions{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:14px 0}.ci-check-slot{margin-left:auto}.island-lab .ci-text-button,.island-lab #reset{background:none;border:0;padding:9px 0;color:#c4b8d7;font-size:12px;text-align:left}.island-lab #check,.island-lab .ci-primary{background:#c7ff79;color:#27331d;border:0;border-radius:15px;padding:14px 25px;font-weight:800;min-height:50px}.ci-reveal{background:#f4efdf;border-radius:22px;color:#382d36;padding:25px 28px;margin-top:16px}.ci-reveal>.ci-kicker{color:#74624b}.ci-reveal h2{font-size:36px;letter-spacing:-.04em;margin:8px 0 12px}.ci-reveal p{font-size:16px;line-height:1.55;margin:12px 0}.ci-reveal #oc-third{font-size:13px;color:#6c5d63}.island-lab .ci-reveal .feedback{font-size:13px;color:#58444f;padding:12px 0 20px;min-height:0;line-height:1.6}.ci-reveal .ci-primary{margin-top:5px}.ci-retry{background:#483041;border:1px solid #a27289;border-radius:16px;padding:8px 20px}.island-lab .ci-retry .feedback{min-height:0;color:#ffe3ec;padding:10px 0}.ci-bottom{display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin:16px 0 3px}.ci-help{background:#322c45;border-radius:15px;padding:17px;font-size:14px;line-height:1.55;color:#e3d8f3}.ci-notes{color:#b6abc8;font-size:13px;line-height:1.6;border-top:1px solid #3c344f;padding:15px 0 0;margin-top:14px}.ci-notes summary{cursor:pointer;font-weight:700}.ci-context{background:#e8dbff;padding:15px 28px;font-size:12px;display:flex;justify-content:space-between;gap:25px;border-top:1px solid #bfabde}.ci-context strong,.ci-context span{display:block}.ci-context span{font-size:10px;max-width:210px;margin-top:6px;line-height:1.5}.ci-context ol{margin:0;padding-left:20px;line-height:1.8}.ci-context b{font-weight:500;color:#70527c;margin-left:10px}.ci-chapters span{white-space:nowrap}
@media(max-width:650px){.island-lab{padding:18px 14px}.island-lab .topbar{margin-bottom:25px}.island-lab .pill{display:none}.island-lab #title{font-size:34px}.island-lab #prompt{font-size:15px;line-height:1.55;margin-bottom:18px}.ci-chapters{gap:11px;font-size:9px;justify-content:space-between}.ci-question{padding:19px 17px 16px;gap:12px;display:block;position:relative}.ci-question h2{font-size:23px;max-width:100%;margin-bottom:9px}.ci-question p{font-size:13px}.ci-resource{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-top:14px;min-width:0;padding:8px 11px;text-align:left}.ci-resource>span{font-size:8px}.ci-resource>strong{font-size:22px}.ci-resource>small{font-size:9px;max-width:95px;text-align:right}.ci-world{height:190px}.ci-options{padding:0 9px;gap:6px}.island-lab .ci-option{border-radius:12px;padding:10px 4px}.ci-option strong{font-size:12px;min-height:30px}.ci-option span{font-size:10px}.ci-option small{font-size:9px;min-height:24px}.ci-nudge{padding:14px 15px 17px;font-size:11px;min-height:62px}.ci-comparison{gap:8px}.ci-comparison>div{padding:14px 12px}.ci-comparison span{font-size:8px}.ci-comparison strong{font-size:17px;line-height:1.2}.ci-comparison small{font-size:11px;line-height:1.4;display:block}.ci-actions{align-items:center}.island-lab #check{font-size:12px;padding:14px 16px}.island-lab .ci-text-button{font-size:11px}.ci-reveal{padding:22px 20px}.ci-reveal h2{font-size:33px}.ci-reveal p{font-size:15px}.ci-reveal .ci-primary{width:100%;font-size:13px;padding:14px}.ci-bottom{gap:14px}.ci-context{padding:13px 17px;display:block}.ci-context span{max-width:none}.ci-context ol{padding-left:18px;margin-top:10px}.ci-context b{font-size:10px;margin-left:6px}.ci-context li{font-size:11px}.island-lab:has(#oc-chapter-challenge[aria-current=step]) .ci-world,.island-lab:has(#oc-chapter-tighter[aria-current=step]) .ci-world{height:170px}}
@media(max-width:360px){.ci-option strong{font-size:11px}.ci-option small{font-size:8px}.ci-chapters{font-size:8px;gap:7px}}
`;

const palette=[{top:'#91f3cf',base:'#30a58f'},{top:'#ffb8d2',base:'#c65c98'},{top:'#ffe386',base:'#db9340'},{top:'#94d9ff',base:'#548bbb'},{top:'#ceb4ff',base:'#8e64bb'},{top:'#ffb09b',base:'#d67270'},{top:'#b4f4b3',base:'#55a78a'}];
function makeToy(id,color){
  const group=new THREE.Group(),white='#fff9ef',ink='#252345',mint='#72ecc8',pink='#ff7caa',purple='#8770ed',gold='#ffd15b',blue='#59c9fa';
  const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.4,metalness:.04});
  function mesh(geometry,c,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat(c));m.position.set(x,y,z);group.add(m);return m;}
  function box(w,h,d,c,x=0,y=0,z=0,r=.12){return mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),c,x,y,z);}
  function ball(r,c,x,y,z){return mesh(new THREE.SphereGeometry(r,20,14),c,x,y,z);}
  function cylinder(rt,rb,h,c,x,y,z){return mesh(new THREE.CylinderGeometry(rt,rb,h,24),c,x,y,z);}
  function barBetween(a,b,r,c){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),m=mesh(new THREE.CylinderGeometry(r,r,start.distanceTo(end),12),c);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;}
  function tree(x,z,s=1){cylinder(.1*s,.15*s,1.1*s,'#b98364',x,.7*s,z);ball(.65*s,mint,x,1.5*s,z);ball(.47*s,'#b3f795',x-.34*s,1.42*s,z);ball(.45*s,'#38bca7',x+.36*s,1.34*s,z);}
  if(['robot','oldrobot','workshop','maker'].includes(id)){
    const c=id==='oldrobot'?'#efa576':mint;
    box(.85,.83,.65,white,0,.81,0);box(1.35,.93,.89,c,0,1.7,0,.21);box(1.04,.55,.11,ink,0,1.72,.47,.15);
    ball(.105,'#c8ffeb',-.26,1.77,.55);ball(.105,'#c8ffeb',.26,1.77,.55);box(.2,.045,.03,pink,0,1.55,.55,.02);
    cylinder(.045,.045,.31,purple,0,2.29,0);ball(.13,pink,0,2.48,0);
    for(const sign of [-1,1]){box(.32,.24,.44,purple,sign*.31,.2,.12);barBetween([sign*.49,1.1,0],[sign*.77,.7,.1],.11,c);ball(.14,purple,sign*.79,.65,.12);const ear=cylinder(.18,.18,.14,purple,sign*.75,1.76,0);ear.rotation.z=Math.PI/2;}
    ball(.11,pink,0,.9,.35);box(.29,.09,.05,gold,0,.58,.35,.02);
    if(id==='oldrobot'){box(.34,.18,.025,purple,-.27,1.92,.46,.02);barBetween([-.41,1.85,.48],[-.14,1.98,.48],.025,gold);}
    if(id==='workshop'||id==='maker'){box(2.05,.16,1.2,gold,0,.05,0);group.scale.setScalar(.9);}
  } else if(['film','demo'].includes(id)){
    box(1.5,1.03,.83,gold,0,1.55,0,.18);box(.8,.55,.08,ink,0,1.57,.45);const lens=cylinder(.34,.28,.58,purple,.37,1.56,.7);lens.rotation.x=Math.PI/2;const glass=cylinder(.24,.24,.025,blue,.37,1.56,1.01);glass.rotation.x=Math.PI/2;
    for(const x of [-.47,.47]){const reel=cylinder(.39,.39,.2,ink,x,2.23,0);reel.rotation.x=Math.PI/2;for(let i=0;i<5;i++)ball(.065,purple,x+Math.cos(i*1.256)*.23,2.23+Math.sin(i*1.256)*.23,.13);}
    for(const [x,z]of [[-.65,.45],[.65,.45],[0,-.65]])barBetween([0,1.03,0],[x,.08,z],.075,purple);
  } else if(['garden','park'].includes(id)){
    tree(-.3,-.1,1.1);box(1.2,.22,.8,white,.35,.18,.5,.1);
    if(id==='garden'){box(1,.16,.65,'#a5735d',.35,.33,.5);for(const [i,c]of [pink,gold,purple].entries()){const x=-.03+i*.35;cylinder(.025,.025,.35,mint,x,.55,.54);for(let j=0;j<5;j++)ball(.1,c,x+Math.cos(j*1.256)*.09,.77+Math.sin(j*1.256)*.09,.54);ball(.06,gold,x,.77,.64);}}
    else{box(1.15,.2,.5,gold,.45,.62,.6);box(1.15,.5,.14,gold,.45,.99,.45);for(const x of [0,.9])box(.12,.5,.35,purple,x,.31,.6);}
  } else if(['drone','upgrade'].includes(id)){
    box(.85,.4,.73,white,0,1.3,0);ball(.2,blue,0,1.48,0);box(.26,.22,.28,ink,0,1.06,.35);
    for(const x of [-.85,.85])for(const z of [-.68,.68]){barBetween([0,1.28,0],[x,1.28,z],.09,purple);cylinder(.09,.09,.3,purple,x,1.48,z);const rotor=mesh(new THREE.TorusGeometry(.4,.065,8,32),gold,x,1.65,z);rotor.rotation.x=Math.PI/2;box(.75,.04,.09,mint,x,1.65,z,.02);}
    for(const x of [-.3,.3])barBetween([x,1.2,0],[x,.15,.32],.05,purple);
  } else if(id==='observatory'){
    cylinder(.84,.92,1.05,white,0,.58,-.15);const dome=mesh(new THREE.SphereGeometry(.87,28,16,0,Math.PI*2,0,Math.PI/2),purple,0,1.1,-.15);box(.29,.63,.04,ink,0,.51,.78,.1);
    const telescope=cylinder(.23,.29,1.25,blue,.35,1.74,.35);telescope.rotation.z=-.65;const lens=cylinder(.25,.25,.12,ink,.73,2.22,.35);lens.rotation.z=-.65;ball(.16,gold,-.7,2.3,-.2);
  } else if(id==='weather'){
    cylinder(.07,.09,1.65,purple,0,.93,0);ball(.43,gold,-.49,1.92,-.12);
    for(let i=0;i<8;i++){const ray=box(.1,.24,.1,gold,-.49+Math.sin(i*Math.PI/4)*.65,1.92+Math.cos(i*Math.PI/4)*.65,-.12,.03);ray.rotation.z=-i*Math.PI/4;}
    for(const [x,y]of [[-.35,1.68],[0,1.82],[.35,1.65]])ball(.39,white,x,y,.2);box(.17,.57,.17,pink,.53,1.02,.15);ball(.14,pink,.53,.75,.15);box(1.15,.2,.75,blue,0,.13,0);
  } else if(id==='game'){
    const controller=box(1.9,1.1,.7,pink,0,1.02,0,.3);controller.rotation.z=-.1;
    box(.47,.14,.13,white,-.52,1.08,.38,.03);box(.14,.47,.13,white,-.52,1.08,.38,.03);
    for(const [x,y,c]of [[.48,1.29,gold],[.72,1.08,mint],[.25,1.08,blue],[.48,.87,purple]])ball(.105,c,x,y,.37);
    box(.45,.08,.08,ink,0,.82,.38,.03);barBetween([0,1.61,-.1],[.08,2,-.1],.055,purple);ball(.11,gold,.08,2.05,-.1);
  } else if(id==='solar'){
    box(1.9,.12,1.2,purple,0,1.15,0);const panel=box(1.7,.05,1.03,'#386ca8',0,1.24,0,.02);
    for(const x of [-.55,0,.55])box(.025,.02,1.03,blue,x,1.28,0,.005);for(const z of [-.25,.25])box(1.7,.02,.025,blue,0,1.28,z,.005);
    for(const x of [-.65,.65])barBetween([x,1.1,0],[x,.12,.1],.07,purple);ball(.4,gold,.75,2.1,-.45);
  } else if(id==='sensor'){
    box(1.2,.25,1.25,mint,0,.65,0);box(.65,.6,.65,purple,0,1.08,0);box(.37,.35,.08,ink,0,1.12,.37);ball(.11,blue,0,1.12,.43);
    for(const x of [-.74,.74])for(const z of [-.4,0,.4])box(.3,.08,.1,gold,x,.66,z,.025);cylinder(.035,.035,.75,purple,.4,1.25,-.4);ball(.15,pink,.4,1.66,-.4);
  } else if(id==='reading'){
    const a=box(.9,.2,1.4,white,-.43,.9,0,.04);a.rotation.z=.18;const b=box(.9,.2,1.4,white,.43,.9,0,.04);b.rotation.z=-.18;
    box(1.92,.1,1.55,purple,0,.71,0);for(const x of [-.4,.4])for(let i=0;i<4;i++)box(.6,.018,.035,'#b0a0d5',x,1.04,-.4+i*.22,.005);box(.12,.03,.7,pink,.55,1.06,.25,.01);
  } else if(id==='volunteer'){
    const heart=new THREE.Shape();heart.moveTo(0,.1);heart.bezierCurveTo(-1,.8,-1.1,1.5,-.55,1.6);heart.bezierCurveTo(-.18,1.69,0,1.4,0,1.4);heart.bezierCurveTo(.25,1.8,1,1.75,1,1.15);heart.bezierCurveTo(1,.7,.3,.25,0,.1);
    const h=mesh(new THREE.ExtrudeGeometry(heart,{depth:.3,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.09,bevelThickness:.09}),pink,0,.4,0);h.scale.setScalar(.9);box(1.6,.3,.8,white,0,.17,0);
  } else if(id==='museum'){
    box(1.9,.22,1.3,purple,0,.15,0);for(const x of [-.65,0,.65]){cylinder(.13,.15,1.25,white,x,.9,.2);box(.36,.13,.36,gold,x,1.5,.2);}const roof=mesh(new THREE.ConeGeometry(1.18,.7,3),pink,0,1.92,0);roof.rotation.y=Math.PI;roof.scale.z=.75;
  } else {
    box(1.8,.48,1,mint,0,.55,0,.22);box(1.8,.75,.32,mint,0,1.02,-.42,.2);for(const x of [-.88,.88])box(.29,.65,1.1,purple,x,.79,0,.13);box(.55,.48,.2,pink,-.45,.98,-.2,.12);
    for(let i=0;i<3;i++){const coin=cylinder(.26,.26,.11,gold,.5,.97+i*.15,.3);coin.rotation.z=.12;}ball(.12,gold,.5,1.6,.3);
  }
  return group;
}

