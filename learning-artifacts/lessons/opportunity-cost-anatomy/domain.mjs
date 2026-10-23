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
  id:'opportunity-cost-anatomy',version:'1.0.0',topicIds:['mt_Qzbh-_v0Gq'],representation:'html_svg',audienceLabel:'Discover, then challenge · ages 10 & 15',
  title:'The One-Afternoon Machine',prompt:'You have 2 free hours. Each adventure takes the whole afternoon. You can do only one.',
  reason:'Explicit Anatomy comparison request: native isometric SVG built with the pinned upstream kit. One ticket can dock at only one activity; the outlined runner-up represents a counterfactual opportunity, not a second purchase. The pure economic model is shared in meaning with Choice Islands.',
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
  sources:['https://github.com/gabreginatto/os-taxonomy/blob/main/data/topics.json','Munger_Models/mental-models.json#opportunity-cost','Munger_Models/course-guidelines.md','https://github.com/wheresryan22/anatomy/tree/1482e8469b0a9e0d8cc18ea2740a01423d29ae80'],
  assetFiles:[{path:'ANATOMY-LICENSE.txt',target:'assets/anatomy-license.txt',sha256:'87c078ab9d90a3044f359e6b563d4e6afea7aa060897cf4f21618687b3856796',license:'MIT',provenance:'Anatomy by Ryan, https://github.com/wheresryan22/anatomy at 1482e8469b0a9e0d8cc18ea2740a01423d29ae80; precomputed SVG and CSS bundled into the plugin.'}],
  contentReview:{status:'source_reviewed',reviewer:'Codex implementation using Anatomy; economic scope retained from the reviewed Choice Islands design',scope:'Exact taxonomy foundation, local course research, counterfactual examples and model boundaries. Expert and learner reviews remain separate.'},
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
  acceptance:[{action:'click',selector:'#am-plan-robot'},{action:'click',selector:'#am-commit'},{action:'assert_text',selector:'#am-question',text:'If building the robot were unavailable'},{action:'click',selector:'#am-plan-film'},{action:'assert_observed',field:'alternative',value:'film'},{action:'assert_text',selector:'#am-comparison',text:'Make a movie'}],
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

