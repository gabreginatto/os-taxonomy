// A self-contained extension example. Taxonomy data is never modified.
export const plugin = {
  id:'fraction-notation-extension',version:'1.0.0',topicIds:['mt_vKcxX6iNOA'],
  representation:'html_svg',title:'Meet the numerator',prompt:'In the fraction 3/4, which number is the numerator?',
  reason:'A labeled fraction and explicit number choices teach notation directly.',
  coverage:[{index:0,mode:'partial',assessed_subclaim:'Identify the numerator in 3/4; explaining both roles and unfamiliar fractions needs more tasks.'}],
  assumptions:['This single example checks identifying a numerator, not mastery of all fraction vocabulary.'],
  sources:['https://github.com/gabreginatto/os-taxonomy/blob/main/data/topics.json'],
  contentReview:{status:'source_reviewed',reviewer:'Codex implementation agent',scope:'Compared the exact Fraction Notation topic/evidence and elementary notation with independent fixed examples. No expert endorsement.'},
  scenario:[{time:2,action:{type:'choose',value:'numerator'}}],
  fixtures:[
    {actions:[{type:'choose',value:'numerator'}],expectedObservation:{choice:'numerator'},expectedCorrect:true},
    {actions:[{type:'choose',value:'denominator'}],expectedObservation:{choice:'denominator'},expectedCorrect:false}
  ],
  acceptance:[
    {action:'click',selector:'#choose-three'},
    {action:'assert_observed',field:'choice',value:'numerator'},
    {action:'assert_text',selector:'#readout',text:'3 is the numerator'}
  ],
  presentationChecks:[
    {time:1,selector:'#demo-ring',attribute:'opacity',equals:'0'},
    {time:4,selector:'#demo-ring',attribute:'opacity',equals:'1'}
  ],
  initialState(){return {choice:null};},
  applyAction(state,action){
    if(action.type!=='choose'||!['numerator','denominator'].includes(action.value))throw new Error('Unsupported notation action');
    return {choice:action.value};
  },
  observe(state){return {...state,label:state.choice==='numerator'?'3 is the numerator':state.choice==='denominator'?'4 is the denominator':'Choose the number above the fraction bar.'};},
  validateInvariants(state){return [null,'numerator','denominator'].includes(state.choice);},
  assess(state){return {correct:state.choice==='numerator',message:state.choice==='numerator'?'Yes! 3 is the numerator. It counts the selected equal parts.':'The numerator is above the fraction bar. Try choosing 3.',scope:'this_response_only'};},
  createPresentation(root,context){
    root.innerHTML='<svg viewBox="0 0 500 300" role="img" aria-label="The fraction three quarters"><circle id="demo-ring" cx="250" cy="100" r="52" fill="none" stroke="#e7a33d" stroke-width="4" opacity="0"/><text x="250" y="130" text-anchor="middle" font-size="86" fill="#087f80" id="numerator-label">3</text><path d="M180 155 H320" stroke="#193343" stroke-width="6"/><text x="250" y="245" text-anchor="middle" font-size="86" fill="#193343">4</text></svg>';
    context.controlsRoot.innerHTML='<div class="buttons"><button id="choose-three" aria-label="Choose 3">3</button><button id="choose-four" aria-label="Choose 4">4</button></div><p>Look above and below the fraction bar.</p>';
    context.controlsRoot.querySelector('#choose-three').onclick=()=>context.dispatch({type:'choose',value:'numerator'});
    context.controlsRoot.querySelector('#choose-four').onclick=()=>context.dispatch({type:'choose',value:'denominator'});
    return {render(observed,presentationTime){root.querySelector('#numerator-label').setAttribute('fill',observed.choice==='numerator'?'#cf7430':'#087f80');root.querySelector('#demo-ring').setAttribute('opacity',presentationTime>=3?'1':'0');},dispose(){},info:{renderer:'html_svg',extension:true}};
  }
};
