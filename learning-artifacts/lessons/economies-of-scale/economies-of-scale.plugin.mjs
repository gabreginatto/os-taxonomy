import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {gsap} from 'gsap';

// Press Club: five working weeks in one fictional print studio (plus a noodle-stall transfer).
// Money is integer pence. The pure model below decides every quantity and every assessment;
// the presentation only replays results that were already computed.

const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT=['M','Tu','W','Th','F','Sa'];
const DAYS_PER_WEEK=DAYS.length;

const STUDIO={
  kind:'studio',base:48000,variable:400,baseLabel:'Studio lease',variableLabel:'Blanks & ink',
  s1:{one:'press',many:'presses',cap:30,cost:6000,included:0,verb:'printed',can:'print',does:'prints'},
  s2:{one:'tunnel',many:'tunnels',cap:40,cost:6000,included:1,verb:'cured',can:'cure',does:'cures'},
  sync:{station:'s1',cost:6000,label:'Sync between press teams'}
};
const NOODLES={
  kind:'noodles',base:20000,variable:240,baseLabel:'Pitch fee',variableLabel:'Ingredients',
  s1:{one:'prep bench',many:'prep benches',cap:80,cost:6000,included:1,verb:'prepped',can:'prep',does:'preps'},
  s2:{one:'wok',many:'woks',cap:50,cost:4500,included:0,verb:'cooked',can:'cook',does:'cooks'},
  sync:{station:'s2',cost:3500,label:'Sync between cooks'}
};
const LEVELS=[
  {id:'rent',biz:STUDIO,unit:'hoodie',units:'hoodies',price:2400,orderChoices:[10,20,30],start:{orders:10,s1:1,s2:1},limits:{s1:[1,1],s2:[1,1]},target:'profit',gate:{type:'volumes',count:2},chartX:'orders',ink:'#7c3aed',correct:'shared'},
  {id:'jam',biz:STUDIO,unit:'tee',units:'tees',price:2000,orders:60,start:{s1:2,s2:1},limits:{s1:[1,2],s2:[1,2]},target:'profit',gate:{type:'stuck'},chartX:'s1',ink:'#e11d74',correct:'slowest'},
  {id:'size',biz:STUDIO,unit:'shirt',units:'shirts',price:1500,orders:200,buyerTakesAll:true,start:{s1:1,s2:1},limits:{s1:[1,6],s2:[1,5]},target:'best',gate:{type:'sizes',count:3},chartX:'s1',ink:'#2563eb',correct:'sync'},
  {id:'fall',biz:STUDIO,unit:'shirt',units:'shirts',price:1700,orders:60,start:{s1:4,s2:3},limits:{s1:[1,6],s2:[1,5]},target:'profit',gate:{type:'idle'},chartX:'s1',ink:'#16a34a',correct:'idle'},
  {id:'noodles',biz:NOODLES,unit:'bowl',units:'bowls',price:600,orders:150,start:{s1:1,s2:1},limits:{s1:[1,3],s2:[1,4]},target:'profit',gate:{type:'configs',count:2},chartX:'s2',ink:'#f59e0b',correct:'carried'}
];

const money=p=>{const v=Math.abs(p)/100;return '£'+(Number.isInteger(v)?v.toLocaleString('en-GB'):v.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}));};
const money2=p=>'£'+(p/100).toFixed(2);
const signed=p=>p>0?'+'+money(p):p<0?'−'+money(p):'£0';
const plural=(n,one,many)=>n+' '+(n===1?one:many);

const COPY={
  rent:{
    week:'The rent doesn’t care',
    client:'Year 11 leavers want hoodies at £24 each. They’ll take 10, 20 or 30 — you decide how many to accept.',
    goal:'Make a profit on the day.',
    gate:'Run at least two different order sizes. Then a question appears here.',
    question:'Why did the cost per hoodie fall when you printed more?',
    reasons:[['shared','More hoodies shared the same £540 of leases.'],['ink','Ordering more blanks reduced the ink cost per hoodie.'],['total','The larger order reduced the total cost of the day.']],
    counters:{ink:'Look at the yellow part of the cost bar: every hoodie still uses £4 of blank and ink, whatever the volume. Which part of the bar stayed the same size?',total:'Compare the day-cost tiles: the total went up with volume. The saving is per hoodie, not in total.'},
    hint:'Before you run, look at the navy and teal blocks: £540 of leases, paid however many you print. Each hoodie also uses £4 of blank and ink. How many hoodies have to share the £540 before £24 each covers everything?',
    onlyOne:'That day hits the goal. Before you answer, run a different number of hoodies as well, so you have something to compare it with.',
    debrief:'Fixed-cost spreading. The leases are a fixed cost: £540 whether you print 10 hoodies or 30. Over 10 hoodies each carries £54 of it; over 30, only £18. Total cost rises with volume (£580 → £660) but cost per hoodie falls (£58 → £22). The studio is the same size: you used it more fully.'
  },
  jam:{
    week:'Where does it jam?',
    client:'A local band wants 60 tour tees at £20 each. Last night you leased a second press.',
    goal:'Deliver the order at a profit.',
    gate:'This question unlocks after a day when some tees get stuck. Monday is already set up — try it.',
    question:'On the day tees got stuck, what decided how many you could sell?',
    reasons:[['slowest','The tunnel’s 40-a-day limit capped finished output.'],['late','Press capacity set output; the remaining 20 count as sales later.'],['price','The second press raised the price, so the band bought fewer tees.']],
    counters:{late:'Stuck tees weren’t late: they were never cured, so they couldn’t be sold today, yet their ink was already paid for. A chain moves only as fast as its slowest step.',price:'The band wanted 60 all along and the price stayed £20. Look at where the red pile formed.'},
    hint:'Follow one pallet: press, then tunnel, then dock. Each press prints 30 a day; each tunnel cures 40. Which station can’t keep up?',
    onlyOne:'That day hits the goal. This question unlocks after you’ve seen a day where tees get stuck.',
    debrief:'A bottleneck. Finished output is set by the smallest capacity in the chain. Two presses print 60, but one tunnel cures 40, so 20 printed tees were paid for and never sold. A second tunnel (+£60) delivers all 60: £960 in total, £16 a tee, £240 profit. Extra capacity anywhere except the bottleneck only adds cost.'
  },
  size:{
    week:'How big?',
    client:'A festival merch tent buys every shirt you cure today at £15 — up to 200.',
    goal:'Find the most profitable size. Run at least three press counts, including a larger balanced setup with a higher cost per shirt; then select the two comparison runs.',
    gate:'Run at least three press counts. Observe cost per shirt falling from a smaller balanced setup, then rising in a larger balanced setup. Avoid stuck shirts and surplus whole stations; select your comparison evidence.',
    question:'Past a certain size, cost per shirt rises again. Why?',
    reasons:[['sync','More pairs of press teams add sync cost faster than the lease saving.'],['ink','The higher cost came from printing shirts that the tunnels could not finish.'],['lease','The higher cost came only from leasing spare whole tunnels.']],
    counters:{ink:'That can explain a jammed setup, but your selected balanced comparison finishes every printed shirt. Compare its sync costs.',lease:'Extra idle tunnels can raise costs, but your selected comparison has only the tunnels it needs. Compare its sync costs.'},
    hint:'Use the preview before you run: committed cost ÷ shirts you can cure, plus £4. Keep the tunnels just big enough for the presses — each press prints 30, each tunnel cures 40.',
    onlyOne:'Observe both sides: a smaller balanced setup with higher cost per shirt, a better setup, and a larger balanced setup whose cost rises again. A jam or idle extra tunnel is different evidence.',
    debrief:'Economies, then diseconomies, of scale. Up to four presses the shared lease is spread over more shirts and cost per shirt falls (£22 → £16 → £14.67 → £14). After that, sync grows with every pair of teams — 6 pairs at four presses, 10 at five, 15 at six — and outruns the saving: £14.40 at five, £15 at six. In this model, four presses and three tunnels is the sweet spot.'
  },
  fall:{
    week:'Orders fall',
    client:'The festival is back, but this time it wants only 60 shirts, at £17 each. Last week’s setup is still leased.',
    goal:'Make a profit on 60 shirts.',
    gate:'This question unlocks after a day where some of your capacity sits idle. Last week’s setup is ready to run.',
    question:'Why does last week’s best setup lose money now?',
    reasons:[['idle','Only 60 shirts now share the same leases and sync costs.'],['ink','The smaller order made blanks and ink cost more per shirt.'],['slow','The smaller order slowed the tunnels and lowered daily output.']],
    counters:{ink:'Still £4 a shirt. Compare the yellow block with the rest of the bar.',slow:'Each tunnel still cures 40 a day. Look for the dimmed stations: what are they costing?'},
    hint:'Each press prints 30 and each tunnel cures 40. What is the smallest studio that can still deliver all 60?',
    onlyOne:'That day hits the goal. This question unlocks after a day where some leased capacity sits idle — last week’s setup would show it.',
    debrief:'Idle capacity. The best size depends on demand. At 60 shirts, four presses and three tunnels cost £24 a shirt and lose £420; two and two cost £16 and make £60. These leases are fresh every day, so shrinking is free here. Equipment you’ve already bought is different: that money is spent either way.'
  },
  noodles:{
    week:'Night Noodles',
    client:'New business, same rules? Your night-market noodle stall has 150 bowls ordered at £6. The £200 pitch fee includes one prep bench.',
    goal:'Serve all 150 bowls at a profit.',
    gate:'Run at least two different setups. Then a question appears here.',
    question:'Which ideas from the print studio carried over to the stall?',
    reasons:[['carried','Output follows the slowest station; volume shares the pitch fee; more cook pairs add sync.'],['bigger','Each extra wok spreads the pitch fee, so adding woks always lowers cost per bowl.'],['flat','The pitch fee stays fixed, so balancing stations changes output but never cost per bowl.']],
    counters:{bigger:'Check your ledger: past a point, adding woks raises the cost per bowl, because every cook has to sync with every other.',flat:'Compare a day that sold 80 bowls with one that sold 150: the same pitch fee is shared very differently.'},
    hint:'Each bench preps 80 bowls and each wok cooks 50. Too few benches leave woks waiting; too few woks leave prepped bowls to waste.',
    onlyOne:'That day hits the goal. Run one more, different setup to compare before you answer.',
    debrief:'The same three rules in a new place. The slowest station caps output (too few benches starve the woks; too few woks waste prepped bowls), the £200 pitch fee is shared across more bowls, and sync between cooks grows with every pair. Three woks and two benches: £860 for 150 bowls, £5.73 a bowl, £40 profit. That’s one more fictional case handled — a good sign, not proof of mastering scale.'
  }
};

const ordersFor=(level,dials)=>level.orderChoices?dials.orders:level.orders;
export function dayResult(level,dials){
  const b=level.biz,n1=dials.s1,n2=dials.s2,orders=ordersFor(level,dials);
  const syncN=b.sync.station==='s1'?n1:n2,pairs=syncN*(syncN-1)/2;
  const lease=b.base,s1Cost=b.s1.cost*(n1-b.s1.included),s2Cost=b.s2.cost*(n2-b.s2.included),sync=b.sync.cost*pairs;
  const committed=lease+s1Cost+s2Cost+sync,cap1=b.s1.cap*n1,cap2=b.s2.cap*n2;
  const entered=Math.min(orders,cap1),done=Math.min(entered,cap2),stuck=entered-done;
  const variable=b.variable*entered,total=committed+variable,revenue=level.price*done;
  return {orders,s1:n1,s2:n2,pairs,lease,s1Cost,s2Cost,sync,committed,cap1,cap2,entered,done,stuck,
    unfilled:level.buyerTakesAll?0:orders-done,variable,total,revenue,profit:revenue-total,average:total/done,
    idle1:n1-Math.ceil(entered/b.s1.cap),idle2:n2-Math.ceil(done/b.s2.cap)};
}
function configs(level){
  const out=[];
  for(const orders of level.orderChoices||[null])for(let s1=level.limits.s1[0];s1<=level.limits.s1[1];s1++)for(let s2=level.limits.s2[0];s2<=level.limits.s2[1];s2++)out.push(orders===null?{s1,s2}:{orders,s1,s2});
  return out;
}
const bestProfit=level=>Math.max(...configs(level).map(d=>dayResult(level,d).profit));
const maxScale=level=>Math.max(...configs(level).map(d=>{const r=dayResult(level,d);return Math.max(r.total,r.revenue);}));
const sameDials=(a,b)=>a.s1===b.s1&&a.s2===b.s2&&a.orders===b.orders;
const runId=r=>r.attempt+':'+r.day;
const classification=r=>r.stuck?'bottleneck':r.idle1||r.idle2?'idle':r.entered<r.cap1?'underused':'efficient';
const efficientScale=r=>r.entered===r.cap1&&r.done===r.entered&&r.s2===Math.ceil(r.done/STUDIO.s2.cap);
const predictionValues=['lower','same','higher'];
const predictionActual=(average,reference)=>Math.abs(average-reference)<0.000001?'same':average<reference?'lower':'higher';
const predictionReference=s=>levelRuns(s).at(-1)||null;
const predictionNeeded=s=>['size','noodles'].includes(LEVELS[s.level].id)&&Boolean(predictionReference(s)&&!sameDials(predictionReference(s).dials,s.dials));
const validComparison=s=>{
  const rows=levelRuns(s),a=rows.find(r=>runId(r)===s.comparison?.baseline),b=rows.find(r=>runId(r)===s.comparison?.larger);
  if(!a||!b)return false;
  const x=dayResult(LEVELS[s.level],a.dials),y=dayResult(LEVELS[s.level],b.dials);
  return x.s1===4&&x.s2===3&&efficientScale(x)&&y.s1>x.s1&&efficientScale(y)&&y.average>x.average;
};
const levelRuns=s=>s.runs.filter(r=>r.level===s.level);
const currentRuns=s=>s.runs.filter(r=>r.level===s.level&&r.attempt===s.attempt);
function gateOpen(s){
  const level=LEVELS[s.level],results=levelRuns(s).map(r=>dayResult(level,r.dials)),g=level.gate;
  if(g.type==='volumes')return new Set(results.map(r=>r.orders)).size>=g.count;
  if(g.type==='sizes')return new Set(results.map(r=>r.s1)).size>=g.count&&results.some(r=>r.s1<4&&efficientScale(r)&&r.average>1400)&&results.some(r=>r.s1>4&&efficientScale(r)&&r.average>1400);
  if(g.type==='configs')return new Set(levelRuns(s).map(r=>JSON.stringify(r.dials))).size>=g.count;
  if(g.type==='stuck')return results.some(r=>r.stuck>0);
  return results.some(r=>r.idle1>0||r.idle2>0);
}
const targetMet=(level,r)=>level.target==='best'?r.profit===bestProfit(level):r.profit>0;

function startLevel(level,history,runs){const L=LEVELS[level];return {level,attempt:0,dials:{...L.start},runs,reason:null,prediction:null,comparison:{baseline:null,larger:null},help:false,history,complete:false};}
const initialState=()=>startLevel(0,[],[]);

function outcome(level,r){
  const b=level.biz,parts=[];
  if(level.buyerTakesAll)parts.push('Sold all '+r.done+' '+level.units+' you finished');
  else parts.push(r.unfilled?'Sold '+r.done+' of '+r.orders:'All '+r.orders+' delivered');
  if(r.stuck)parts.push(r.stuck+' '+b.s1.verb+' but never '+b.s2.verb);
  if(r.unfilled)parts.push(r.unfilled+' orders unfilled');
  if(r.idle1)parts.push(plural(r.idle1,b.s1.one,b.s1.many)+' idle');
  if(r.idle2)parts.push(plural(r.idle2,b.s2.one,b.s2.many)+' idle');
  return parts.join(' · ');
}
function missMessage(level,r){
  const b=level.biz,parts=[];
  if(r.stuck)parts.push(r.stuck+' '+level.units+' were '+b.s1.verb+' but never '+b.s2.verb+': paid for, not sold.');
  if(r.unfilled)parts.push(r.unfilled+' orders went unfilled.');
  const idle=[r.idle1&&plural(r.idle1,b.s1.one,b.s1.many),r.idle2&&plural(r.idle2,b.s2.one,b.s2.many)].filter(Boolean);
  if(idle.length)parts.push(idle.join(' and ')+' sat idle, still leased.');
  if(r.profit<0)parts.push('The day lost '+money(-r.profit)+'. Fixed costs of '+money(r.committed)+' were shared by '+r.done+' '+level.units+': '+money2(r.committed/r.done)+' each before '+b.variableLabel.toLowerCase()+'.');
  else if(r.profit===0)parts.push('The day only broke even — a profit means revenue above cost.');
  else parts.push('Profitable ('+signed(r.profit)+') — but is it the most profitable size? Your ledger only shows the sizes you’ve run.');
  return parts.join(' ');
}
function assess(s){
  const base={scope:'this_response_only',mastery_claim:false,assistance:s.help?'help_requested':'help_not_requested'};
  if(s.complete)return {...base,correct:true,kind:'course_complete',message:'All five weeks are done. Your finishing ledger is below. These were bounded responses to fictional cases, not a test of everything about scale.'};
  const level=LEVELS[s.level],c=COPY[level.id],runs=currentRuns(s),last=runs.at(-1);
  const kind=level.id==='noodles'?'transfer_configuration_and_reason':'configuration_and_reason';
  if(!last)return {...base,correct:false,kind,message:'Nothing has run yet. Set up '+DAYS[0]+' and press Run.'};
  if(!sameDials(last.dials,s.dials))return {...base,correct:false,kind,message:'You’ve changed the setup since your last run. Only a day you actually ran counts: run this setup, or put it back.'};
  const r=dayResult(level,last.dials);
  if(!targetMet(level,r))return {...base,correct:false,kind,message:missMessage(level,r)};
  if(!gateOpen(s))return {...base,correct:false,kind,message:c.onlyOne};
  if(level.id==='size'&&!validComparison(s))return {...base,correct:false,kind,message:'Select two actual ledger runs: your best balanced setup and a larger balanced setup with a higher cost per shirt. Jams and surplus whole stations do not demonstrate rising coordination cost.'};
  if(!s.reason)return {...base,correct:false,kind,message:'That run hits the goal. Now answer the question: '+c.question};
  if(s.reason!==level.correct)return {...base,correct:false,kind,message:'Your setup works. Your reason doesn’t fit the evidence yet: '+c.counters[s.reason]};
  return {...base,correct:true,kind,message:c.debrief};
}

function observe(s){
  const level=LEVELS[s.level],c=COPY[level.id],b=level.biz,runs=currentRuns(s),day=runs.length,last=runs.at(-1);
  const matches=Boolean(last&&sameDials(last.dials,s.dials)),preview=dayResult(level,s.dials),result=matches?dayResult(level,last.dials):null;
  const ledger=levelRuns(s).map(r=>{const x=dayResult(level,r.dials);return {id:runId(r),classification:classification(x),total:x.total,idle1:x.idle1,idle2:x.idle2,cap1:x.cap1,cap2:x.cap2,prediction:r.prediction||null,day:r.day,attempt:r.attempt,current:r.attempt===s.attempt,dials:r.dials,orders:x.orders,s1:x.s1,s2:x.s2,average:x.average,profit:x.profit,stuck:x.stuck,unfilled:x.unfilled,done:x.done};});
  const history=s.history.map((h,i)=>{const L=LEVELS[i],x=dayResult(L,h.dials);return {...h,week:COPY[L.id].week,unit:L.unit,units:L.units,s1:x.s1,s2:x.s2,orders:x.orders,done:x.done,average:x.average,profit:x.profit};});
  const reference=predictionReference(s),referenceResult=reference?dayResult(level,reference.dials):null;
  const rotation=(s.level+1)%c.reasons.length,reasons=[...c.reasons.slice(rotation),...c.reasons.slice(0,rotation)];
  const label='Week '+(s.level+1)+', '+(s.complete?'all five weeks complete':result?DAYS[day-1]+': '+outcome(level,result)+'; '+money(result.total)+' total, '+money2(result.average)+' per '+level.unit+', profit '+signed(result.profit):'next day '+(day<DAYS_PER_WEEK?DAYS[day]:'none — week over')+'; not run yet');
  return {
    level:s.level,levelId:level.id,kind:b.kind,week:s.level+1,weeks:LEVELS.length,title:c.week,client:c.client,goal:c.goal,
    unit:level.unit,units:level.units,price:level.price,orderChoices:level.orderChoices||null,limits:level.limits,
    s1Name:b.s1,s2Name:b.s2,variableRate:b.variable,syncStation:b.sync.station,chartX:level.chartX,ink:level.ink,baseLabel:b.baseLabel,variableLabel:b.variableLabel,syncLabel:b.sync.label,
    day,daysLeft:DAYS_PER_WEEK-day,nextDay:day<DAYS_PER_WEEK?DAYS[day]:null,weekOver:day>=DAYS_PER_WEEK,attempt:s.attempt,
    dials:{...s.dials},preview,matches,result,lastDay:last?last.day:null,ledger,history,
    predictionRequired:predictionNeeded(s)&&!matches,prediction:s.prediction,predictionOptions:[['lower','Lower cost per unit'],['same','Same cost per unit'],['higher','Higher cost per unit']],
    predictionReference:reference?{id:runId(reference),s1:referenceResult.s1,s2:referenceResult.s2,average:referenceResult.average,done:referenceResult.done,total:referenceResult.total,profit:referenceResult.profit}:null,
    predictionFeedback:matches?last.prediction||null:null,comparisonRequired:level.id==='size',comparison:{...s.comparison},comparisonOptions:level.id==='size'?ledger:[],comparisonValid:level.id==='size'&&validComparison(s),
    gateOpen:gateOpen(s),gate:c.gate,question:c.question,reasons,reason:s.reason,help:s.help,hint:c.hint,
    complete:s.complete,maxScale:maxScale(level),
    outcome:result?outcome(level,result):null,
    committed:preview.committed,cured:result?result.done:null,stuck:result?result.stuck:null,unfilled:result?result.unfilled:null,
    total:result?result.total:null,average:result?result.average:null,profit:result?result.profit:null,
    label
  };
}

function validDials(level,d){
  if(!d||typeof d!=='object')return false;
  const keys=Object.keys(d).sort().join(',');
  if(keys!==(level.orderChoices?'orders,s1,s2':'s1,s2'))return false;
  if(level.orderChoices&&!level.orderChoices.includes(d.orders))return false;
  return ['s1','s2'].every(k=>Number.isInteger(d[k])&&d[k]>=level.limits[k][0]&&d[k]<=level.limits[k][1]);
}
function validateInvariants(s){
  if(!s||!Number.isInteger(s.level)||s.level<0||s.level>=LEVELS.length||!Number.isInteger(s.attempt)||s.attempt<0)return false;
  if(typeof s.help!=='boolean'||typeof s.complete!=='boolean'||(s.complete&&s.level!==LEVELS.length-1))return false;
  const level=LEVELS[s.level];
  if(!validDials(level,s.dials)||!Array.isArray(s.runs)||!Array.isArray(s.history))return false;
  if(s.history.length!==(s.complete?LEVELS.length:s.level))return false;
  if(!s.history.every((h,i)=>h.level===LEVELS[i].id&&validDials(LEVELS[i],h.dials)&&targetMet(LEVELS[i],dayResult(LEVELS[i],h.dials))&&h.reason===LEVELS[i].correct))return false;
  const counts=new Map();
  const previous=new Map();
  for(const r of s.runs){
    if(!Number.isInteger(r.level)||r.level<0||r.level>s.level||!Number.isInteger(r.attempt)||r.attempt<0||(r.level===s.level&&r.attempt>s.attempt))return false;
    if(!validDials(LEVELS[r.level],r.dials))return false;
    const prior=previous.get(r.level),L=LEVELS[r.level],needs=['size','noodles'].includes(L.id)&&prior&&!sameDials(prior.dials,r.dials);
    if(needs){
      const q=r.prediction,x=dayResult(L,r.dials),ref=dayResult(L,prior.dials),actual=predictionActual(x.average,ref.average);
      if(!q||!predictionValues.includes(q.value)||q.referenceId!==runId(prior)||q.referenceAverage!==ref.average||q.average!==x.average||q.actual!==actual||q.correct!==(q.value===actual))return false;
    }else if(r.prediction!==null)return false;
    previous.set(r.level,r);
    const key=r.level+':'+r.attempt,n=counts.get(key)||0;
    if(r.day!==n||n>=DAYS_PER_WEEK)return false;
    counts.set(key,n+1);
  }
  if(s.prediction!==null&&!predictionValues.includes(s.prediction))return false;
  if(!s.comparison||!['baseline','larger'].every(k=>s.comparison[k]===null||levelRuns(s).some(r=>runId(r)===s.comparison[k])))return false;
  if(s.reason!==null&&!COPY[level.id].reasons.some(([id])=>id===s.reason))return false;
  if(s.reason!==null&&!gateOpen(s))return false;
  return true;
}
function applyAction(s,action){
  const {type,key,value}=action||{};
  if(type==='restart')return initialState();
  if(type==='help')return {...s,help:true};
  if(s.complete)throw Error('All five weeks are complete; restart to play again.');
  const level=LEVELS[s.level];
  if(type==='set'){
    const dials={...s.dials,[key]:value};
    if(!['orders','s1','s2'].includes(key)||!validDials(level,dials))throw Error('That setup is not available this week.');
    return {...s,dials,prediction:null};
  }
  if(type==='predict'){
    if(!predictionNeeded(s)||!predictionValues.includes(value))throw Error('Choose a prediction for a changed setup.');
    return {...s,prediction:value};
  }
  if(type==='compare'){
    if(level.id!=='size'||!['baseline','larger'].includes(key)||!levelRuns(s).some(r=>runId(r)===value))throw Error('Select a run from this week’s ledger.');
    return {...s,comparison:{...s.comparison,[key]:value}};
  }
  if(type==='run'){
    const day=currentRuns(s).length;
    if(day>=DAYS_PER_WEEK)throw Error('The week is over; restart the week to run more days.');
    const needed=predictionNeeded(s),reference=predictionReference(s),average=dayResult(level,s.dials).average;
    if(needed&&!s.prediction)throw Error('Predict the cost per unit before running this changed setup.');
    const referenceAverage=needed?dayResult(level,reference.dials).average:null;
    const prediction=needed?{value:s.prediction,referenceId:runId(reference),referenceAverage,average,actual:predictionActual(average,referenceAverage),correct:s.prediction===predictionActual(average,referenceAverage)}:null;
    return {...s,prediction:null,runs:[...s.runs,{level:s.level,attempt:s.attempt,day,dials:{...s.dials},prediction}]};
  }
  if(type==='reason'){
    if(!gateOpen(s)||!COPY[level.id].reasons.some(([id])=>id===value))throw Error('That question is not open yet.');
    return {...s,reason:value};
  }
  if(type==='retry')return {...s,attempt:s.attempt+1,dials:{...level.start},reason:null,prediction:null,comparison:{baseline:null,larger:null}};
  if(type==='next'){
    if(!assess(s).correct)throw Error('Finish this week before moving on.');
    const history=[...s.history,{level:level.id,dials:{...s.dials},reason:s.reason,help:s.help,attempts:s.attempt+1,days:currentRuns(s).length}];
    return s.level===LEVELS.length-1?{...s,history,complete:true}:startLevel(s.level+1,history,s.runs);
  }
  throw Error('Unsupported Press Club action');
}

// Action scripts used by fixtures (and mirrored in the unit tests).
const set=(key,value)=>({type:'set',key,value}),run={type:'run'},reason=value=>({type:'reason',value}),next={type:'next'};
const winWeek1=[set('orders',20),run,set('orders',30),run,reason('shared'),next];
const winWeek2=[...winWeek1,run,set('s2',2),run,reason('slowest'),next];
const predict=value=>({type:'predict',value}),compare=(key,value)=>({type:'compare',key,value});
const winWeek3=[...winWeek2,run,set('s1',5),set('s2',4),predict('lower'),run,set('s1',4),set('s2',3),predict('lower'),run,compare('baseline','0:2'),compare('larger','0:1'),reason('sync'),next];
const winWeek4=[...winWeek3,run,set('s1',2),set('s2',2),run,reason('idle'),next];

export const plugin={
  id:'economies-of-scale',version:'2.1.0',topicIds:['mt_9gpUHWVKMR'],representation:'threejs',audienceLabel:'Age 15 · Economies of scale',
  title:'Press Club',
  prompt:'Run a merch print studio for five weeks. Lease presses and curing tunnels, ship orders, and find out when getting bigger makes each shirt cheaper — and when it stops.',
  reason:'Requested colorful, tactile 3D with meaningful direct interaction. The studio floor shows pallets flowing through presses and tunnels, a pile where the bottleneck jams, sync cables between press teams and a live cost bar; stations are added, removed and run by picking them in the scene, with matching buttons. GSAP replays results; the pure cost model determines every number and the assessment.',
  coverage:[
    {index:1,mode:'partial',assessed_subclaim:'Use computed revenue, total cost and profit for each day the learner ran to choose a profitable configuration; profit arithmetic is displayed rather than calculated unaided.'},
    {index:2,mode:'partial',assessed_subclaim:'Recognise loss-making days (costs above revenue) from the learner’s own runs and change the configuration in response; no free-text explanation is graded.'}
  ],
  assumptions:[
    'All figures are fictional teaching data. Leases are fresh daily contracts: any size can be leased each day and nothing is bought, so shrinking has no sunk cost here. Real equipment purchases do.',
    'Sync cost = £60 per pair of press teams (week 5: £35 per pair of cooks) is an invented stand-in for coordination overhead. Real overhead grows with size, but not by this exact formula.',
    'Blanks and ink cost £4 per printed shirt at every size. Bulk purchasing discounts, a real second source of economies of scale, are deliberately excluded.',
    'Finished output = min(orders, first-station capacity, second-station capacity). The first station works until the order or its capacity is reached; anything it processes that the second station cannot finish is paid for and worth nothing that day (no inventory or carry-over).',
    'Each client sets the price and buys only confirmed orders (week 3’s buyer takes everything up to 200). Quality is constant; no uncertainty, defects, wages beyond the leases, tax or finance.',
    'Each pallet in the scene is exactly 10 units from the model. Six runs per training round are an experiment allowance, not a cash balance or solvency test. Resetting the round restores the allowance and keeps prior results on the ledger.',
    'Costs & Revenue (ages 7–9) is a partial foundation. Fixed vs variable cost, bottlenecks, scale curves and coordination are authored extensions; whole-number money arithmetic and reading a simple chart are assumed, not inferred from age.',
    'Not taught or assessed: marginal cost by name, short- vs long-run cost curves, demand curves and pricing, supplier bargaining, learning curves, network effects, inventory. A correct week is one bounded response, not mastery.',
    'Local Munger attribution relies on an unofficial transcript mirror; this activity quotes no speech and makes no claim about who invented the idea. No economics expert, learner or physical-device review has been performed.'
  ],
  sources:['https://github.com/gabreginatto/os-taxonomy/blob/main/data/topics.json','Munger_Models/mental-models.json#scale','Munger_Models/course-guidelines.md','learning-artifacts/lessons/economies-of-scale/design-brief.md'],
  contentReview:{status:'source_reviewed',reviewer:'Claude (engineer) with Fable (design advisor)',scope:'Exact local Costs & Revenue evidence, local scale research, explicit fictional equations, and an independent re-derivation of every tabulated outcome. No external economics source retrieved; no expert, learner or device review.'},
  scenario:winWeek3.slice(0,-1).map((action,i)=>({time:(i+1)/2,action})),
  fixtures:[
    {actions:[],expectedObservation:{day:0,committed:54000,cured:null,matches:false},expectedCorrect:false},
    {actions:[run],expectedObservation:{cured:10,total:58000,average:5800,profit:-34000},expectedCorrect:false},
    {actions:[set('orders',30),run],expectedObservation:{cured:30,total:66000,average:2200,profit:6000,gateOpen:false},expectedCorrect:false},
    {actions:[set('orders',10),run,set('orders',30),run,reason('total')],expectedObservation:{cured:30,profit:6000,gateOpen:true},expectedCorrect:false},
    {actions:winWeek1.slice(0,5),expectedObservation:{cured:30,total:66000,average:2200,profit:6000},expectedCorrect:true},
    {actions:[...winWeek1.slice(0,5),set('orders',20)],expectedObservation:{matches:false},expectedCorrect:false},
    {actions:[...winWeek1,run],expectedObservation:{level:1,cured:40,stuck:20,unfilled:20,total:90000,average:2250,profit:-10000},expectedCorrect:false},
    {actions:[...winWeek1,run,set('s2',2),run,reason('slowest')],expectedObservation:{cured:60,stuck:0,total:96000,average:1600,profit:24000},expectedCorrect:true},
    {actions:[...winWeek1,run,set('s1',1),set('s2',2),run],expectedObservation:{cured:30,unfilled:30,total:72000,profit:-12000},expectedCorrect:false},
    {actions:[...winWeek2,run,set('s1',2),set('s2',2),predict('lower'),run,set('s1',5),set('s2',4),predict('lower'),run],expectedObservation:{cured:150,total:216000,average:1440,profit:9000},expectedCorrect:false},
    {actions:[...winWeek2,run,set('s1',4),set('s2',2),predict('lower'),run],expectedObservation:{cured:80,stuck:40,total:162000,average:2025,profit:-42000},expectedCorrect:false},
    {actions:winWeek3.slice(0,-1),expectedObservation:{cured:120,total:168000,average:1400,profit:12000},expectedCorrect:true},
    {actions:[...winWeek3,run],expectedObservation:{level:3,cured:60,total:144000,average:2400,profit:-42000},expectedCorrect:false},
    {actions:[...winWeek3,run,set('s1',2),run],expectedObservation:{cured:60,total:102000,average:1700,profit:0},expectedCorrect:false},
    {actions:winWeek4.slice(0,-1),expectedObservation:{cured:60,total:96000,average:1600,profit:6000},expectedCorrect:true},
    {actions:[...winWeek4,set('s2',3),run],expectedObservation:{level:4,cured:80,stuck:0,unfilled:70,total:63200,profit:-15200},expectedCorrect:false},
    {actions:[...winWeek4,set('s1',2),set('s2',2),run],expectedObservation:{cured:100,stuck:50,total:74500,profit:-14500},expectedCorrect:false},
    {actions:[...winWeek4,run,set('s1',2),set('s2',3),predict('lower'),run,reason('carried')],expectedObservation:{cured:150,total:86000,profit:4000},expectedCorrect:true},
    {actions:[...winWeek2,run,set('s1',2),set('s2',2),predict('lower'),run,set('s1',4),set('s2',3),predict('lower'),run],expectedObservation:{gateOpen:false,comparisonValid:false},expectedCorrect:false},
    {actions:[...winWeek2,set('s1',4),set('s2',3),run,set('s1',5),set('s2',4),predict('higher'),run,set('s1',6),set('s2',5),predict('higher'),run],expectedObservation:{gateOpen:false,comparisonValid:false},expectedCorrect:false},
    {actions:winWeek3.slice(0,-4),expectedObservation:{gateOpen:true,comparisonValid:false},expectedCorrect:false},
    {actions:[...winWeek2,run,set('s1',5),set('s2',4),predict('higher'),run],expectedObservation:{day:2,gateOpen:false},expectedCorrect:false},
    {actions:[run,run,run,run,run,run],expectedObservation:{day:6,daysLeft:0,weekOver:true},expectedCorrect:false}
  ],
  acceptance:[
    {action:'click',selector:'#pc-orders-20'},
    {action:'click',selector:'#pc-run'},
    {action:'assert_text',selector:'#pc-tile-avg',text:'£31.00'},
    {action:'click',selector:'#pc-orders-30'},
    {action:'click',selector:'#pc-run'},
    {action:'assert_text',selector:'#pc-tile-avg',text:'£22.00'},
    {action:'assert_observed',field:'daysLeft',value:4},
    {action:'assert_observed',field:'predictionRequired',value:false},
    {action:'assert_observed',field:'gateOpen',value:true},
    {action:'click',selector:'#pc-reason-shared'},
    {action:'assert_observed',field:'profit',value:6000}
  ],
  initialState,applyAction,observe,validateInvariants,assess,createPresentation
};

// ---------- Presentation: Three.js studio floor + DOM HUD ----------

const PALETTE={
  floor:'#f4efe6',floorEdge:'#d9cfbe',mat:'#ebe2d2',dock:'#e4dac8',sky:'#fbf7f0',
  lease:'#1e2a44',s1:'#2bb3a3',s2:'#f08a4b',sync:'#94a3b8',variable:'#facc15',revenue:'#16a34a',
  cable:'#334155',stuck:'#dc2626',wood:'#c9a36b',blank:'#ffffff',kraft:'#c08a5b',ghost:'#ffffff',dark:'#24303f',run:'#22c55e',runOff:'#9ca3af',
  bench:'#c8915a',stove:'#3b3b3b',raw:'#f5f5f4',prepped:'#a3e635',cooked:'#f59e0b',flame:'#f97316',minus:'#f43f5e'
};
const ROWS={intake:3.05,s1:1.25,pile:-0.05,s2:-1.35,dock:-3.2,bar:4.05};
const UNIT={press:{w:1.0,d:1.15,gap:0.35},tunnel:{w:1.6,d:1.0,gap:0.3},bench:{w:1.6,d:1.0,gap:0.3},wok:{w:1.0,d:1.0,gap:0.35}};
const VIEW=new THREE.Box3(new THREE.Vector3(-5.5,-0.45,-4.45),new THREE.Vector3(5.5,1.6,4.5));
const BAR_LEFT=-5,BAR_LENGTH=10;

function createPresentation(root,{dispatch}){
  const app=root.closest('.app')||document.body;
  app.classList.add('press-club');
  const style=document.createElement('style');style.textContent=CSS;document.head.append(style);
  const surface=document.createElement('div');surface.className='pc';surface.innerHTML=TEMPLATE;root.append(surface);
  const $=id=>surface.querySelector('#'+id);
  surface.querySelector('.pc-ledger').open=!matchMedia('(max-width:900px)').matches;
  const revealResult=()=>{if(matchMedia('(max-width:900px)').matches)surface.querySelector('.pc-result')?.scrollIntoView({block:'start',behavior:'instant'});};
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Adopt the host's shared Check / Start again / feedback controls so they sit inside the game.
  const adopted=[['check','pc-check-slot'],['feedback','pc-feedback-slot'],['reset','pc-reset-slot'],['readout','pc-readout-slot']].map(([id,slot])=>{
    const el=app.querySelector('#'+id);if(!el)return null;
    const home={el,parent:el.parentNode,next:el.nextSibling,text:el.textContent};$(slot).replaceWith(el);return home;
  }).filter(Boolean);
  const check=app.querySelector('#check'),reset=app.querySelector('#reset'),readout=app.querySelector('#readout');
  if(check)check.textContent='Check my week';
  if(reset)reset.textContent='Restart the game';
  readout?.classList.add('pc-sr');
  const pill=app.querySelector('.topbar .pill'),pillText=pill?.textContent;if(pill)pill.textContent='Age 15 · Economies of scale';

  // Renderer and fixed camera.
  const worldEl=$('pc-world'),badges=$('pc-badges');
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(PALETTE.sky,1);
  renderer.domElement.setAttribute('role','img');
  worldEl.prepend(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0.1,100);
  scene.add(new THREE.HemisphereLight('#ffffff','#b9a98f',1.7));
  const sun=new THREE.DirectionalLight('#fff6e8',2.3);sun.position.set(-5,11,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:40});sun.shadow.bias=-0.0008;scene.add(sun);
  const world=new THREE.Group();scene.add(world);

  const geos=new Map(),mats=new Map(),owned=[];
  const geo=(key,make)=>{if(!geos.has(key))geos.set(key,make());return geos.get(key);};
  const rbox=(w,h,d)=>geo('rb:'+w+':'+h+':'+d,()=>new RoundedBoxGeometry(w,h,d,2,Math.min(0.06,w*0.2,h*0.3,d*0.2)));
  const boxGeo=(w,h,d)=>geo('b:'+w+':'+h+':'+d,()=>new THREE.BoxGeometry(w,h,d));
  const mat=(color,{dim=false,opacity=1,emissive=null}={})=>{
    const key=[color,dim,opacity,emissive].join('|');
    if(!mats.has(key)){
      const c=new THREE.Color(color);if(dim)c.lerp(new THREE.Color('#cfc9bf'),0.62);
      mats.set(key,new THREE.MeshStandardMaterial({color:c,roughness:0.62,metalness:0.04,transparent:opacity<1,opacity,depthWrite:opacity>=1,...(emissive?{emissive:new THREE.Color(emissive),emissiveIntensity:0.6}:{})}));
    }
    return mats.get(key);
  };
  const ownMat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:0.55,metalness:0.04,...extra});owned.push(m);return m;};
  function mesh(parent,geometry,material,x=0,y=0,z=0,{shadow=true,tint=null}={}){
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;
    if(tint)m.userData.tint=tint;parent.add(m);return m;
  }
  const block=(parent,w,h,d,color,x,y,z,opts={})=>mesh(parent,rbox(w,h,d),mat(color,opts),x,y+h/2,z,{tint:opts.dimmable?color:null});

  let view=null,observed=null,previous=null,clock={t:0},tween=null,pulse=null,signature='',disposed=false;
  const info={renderer:'threejs',tool:'Three.js + GSAP',pick_targets:[],geometry:'procedural print studio and noodle stall',device_performance:'not_measured'};
  let pickables=[];

  // ----- Scene construction for one (week, setup) layout -----
  // Rows are centred on the slots they show (leased units plus an add slot), so a small studio sits mid-floor.
  function unitX(spec,i){const slots=spec.slots||1,width=slots*(spec.w+spec.gap)-spec.gap;return -width/2+spec.w/2+i*(spec.w+spec.gap);}
  function rowSpecs(o){
    const [a,b]=o.kind==='studio'?[{...UNIT.press,type:'press'},{...UNIT.tunnel,type:'tunnel'}]:[{...UNIT.bench,type:'bench'},{...UNIT.wok,type:'wok'}];
    a.slots=o.dials.s1+(o.dials.s1<o.limits.s1[1]?1:0);b.slots=o.dials.s2+(o.dials.s2<o.limits.s2[1]?1:0);
    return {s1:a,s2:b};
  }
  function addHit(parent,w,h,d,x,y,z,action,name){
    const m=new THREE.Mesh(boxGeo(w,h,d),mat('#000000'));m.position.set(x,y,z);m.visible=false;m.userData.action=action;m.userData.name=name;parent.add(m);pickables.push(m);return m;
  }
  function press(g,ink){
    block(g,1.0,0.5,1.15,PALETTE.s1,0,0,0,{dimmable:true});
    block(g,0.72,0.05,0.62,PALETTE.dark,0,0.5,0.14);
    for(const x of [-0.42,0.42])block(g,0.09,0.86,0.09,'#1f7f76',x,0.5,-0.44,{dimmable:true});
    block(g,0.98,0.1,0.12,'#1f7f76',0,1.32,-0.44,{dimmable:true});
    const head=new THREE.Group();head.position.set(0,1.18,0.12);g.add(head);
    block(head,0.12,0.1,0.56,'#1f7f76',0,0.06,-0.28,{dimmable:true});
    block(head,0.62,0.13,0.5,'#5fd0c3',0,-0.1,0,{dimmable:true});
    block(g,0.24,0.07,0.18,ink,0.34,0.5,0.47);
    return {head,headY:1.18};
  }
  function arch(){
    return geo('arch',()=>{
      const s=new THREE.Shape();s.moveTo(-0.66,0);s.lineTo(-0.66,0.42);s.absarc(0,0.42,0.66,Math.PI,0,true);s.lineTo(0.66,0);s.lineTo(0.5,0);s.lineTo(0.5,0.42);s.absarc(0,0.42,0.5,0,Math.PI,false);s.lineTo(-0.5,0);s.closePath();
      const e=new THREE.ExtrudeGeometry(s,{depth:0.86,bevelEnabled:true,bevelSize:0.03,bevelThickness:0.03,bevelSegments:2,curveSegments:16});e.translate(0,0,-0.43);return e;
    });
  }
  function tunnel(g){
    block(g,1.32,0.14,1.0,PALETTE.dark,0,0,0);
    for(const x of [-0.72,0.72])block(g,0.14,0.42,0.86,'#c46a35',x,0,0,{dimmable:true});
    const a=mesh(g,arch(),mat(PALETTE.s2),0,0.14,0,{tint:PALETTE.s2});
    const glowMat=ownMat('#ffd6a8',{emissive:new THREE.Color('#ff9a3c'),emissiveIntensity:0});
    mesh(g,boxGeo(0.9,0.04,0.8),glowMat,0,0.86,0,{shadow:false});
    return {arch:a,glow:glowMat};
  }
  function bench(g){
    block(g,1.5,0.1,0.9,PALETTE.bench,0,0.5,0,{dimmable:true});
    for(const x of [-0.65,0.65])for(const z of [-0.35,0.35])block(g,0.08,0.5,0.08,'#8a5d34',x,0,z,{dimmable:true});
    block(g,0.6,0.04,0.42,'#f3e6cf',-0.25,0.6,0.05);
    for(const [x,c] of [[0.35,'#65a30d'],[0.55,'#ea580c'],[0.45,'#84cc16']])mesh(g,geo('veg',()=>new THREE.SphereGeometry(0.09,12,8)),mat(c),x,0.69,x===0.45?-0.2:0.15);
    return {};
  }
  function wok(g){
    block(g,0.95,0.5,0.95,PALETTE.stove,0,0,0,{dimmable:true});
    const flame=mesh(g,geo('flame',()=>new THREE.ConeGeometry(0.17,0.3,12)),ownMat(PALETTE.flame,{emissive:new THREE.Color(PALETTE.flame),emissiveIntensity:0.9}),0,0.62,0,{shadow:false});
    flame.scale.setScalar(0.35);
    mesh(g,geo('wok',()=>new THREE.SphereGeometry(0.4,20,10,0,Math.PI*2,Math.PI/2,Math.PI/2)),mat('#52525b'),0,0.86,0,{tint:'#52525b'});
    mesh(g,geo('handle',()=>new THREE.CylinderGeometry(0.035,0.035,0.42,8)),mat('#7c4a24'),0.55,0.86,0).rotation.z=Math.PI/2;
    return {flame};
  }
  function ghost(parent,spec,x,z,action,name){
    const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);
    mesh(g,rbox(spec.w,0.42,spec.d),mat(PALETTE.ghost,{opacity:0.45}),0,0.21,0,{shadow:false});
    block(g,0.46,0.07,0.12,PALETTE.s1,0,0.42,0);block(g,0.12,0.07,0.46,PALETTE.s1,0,0.42,0);
    addHit(g,spec.w+spec.gap*0.8,0.9,spec.d+0.3,0,0.45,0,action,name);
  }
  function minusToken(parent,spec,x,z,action,name){
    const g=new THREE.Group();g.position.set(x+spec.w/2-0.12,0,z+spec.d/2+0.28);parent.add(g);
    mesh(g,geo('token',()=>new THREE.CylinderGeometry(0.2,0.2,0.07,20)),mat(PALETTE.minus),0,0.035,0);
    block(g,0.22,0.03,0.06,'#ffffff',0,0.07,0);
    addHit(g,0.7,0.5,0.6,0,0.2,0,action,name);
  }
  function palletMesh(o){
    const g=new THREE.Group();
    const studio=o.kind==='studio';
    mesh(g,rbox(0.6,0.08,0.6),mat(studio?PALETTE.wood:'#e7e5e4'),0,0.04,0);
    const load=mesh(g,studio?rbox(0.5,0.26,0.5):geo('bowls',()=>new THREE.CylinderGeometry(0.25,0.18,0.24,18)),mat(studio?PALETTE.blank:PALETTE.raw),0,0.08+0.13,0);
    const tag=new THREE.Group();tag.position.set(0.24,0.34,0.24);g.add(tag);
    block(tag,0.03,0.34,0.03,'#7f1d1d',0,0,0);block(tag,0.22,0.14,0.03,PALETTE.stuck,0.11,0.2,0);
    tag.visible=false;
    return {g,load,tag};
  }
  function cables(parent,o,spec,n){
    const row=o.syncStation==='s1'?ROWS.s1:ROWS.s2,top=spec.type==='press'?1.5:spec.type==='wok'?1.05:0.95;
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
      const a=new THREE.Vector3(unitX(spec,i),top,row-0.05),b=new THREE.Vector3(unitX(spec,j),top,row-0.05);
      const mid=a.clone().add(b).multiplyScalar(0.5);mid.y+=0.35+0.3*(j-i);
      const curve=new THREE.QuadraticBezierCurve3(a,mid,b);
      mesh(parent,geo('cable:'+spec.type+':'+spec.slots+':'+i+':'+j,()=>new THREE.TubeGeometry(curve,28,0.045,8,false)),mat(PALETTE.cable),0,0,0,{shadow:false});
    }
  }
  function runButton(parent){
    const g=new THREE.Group();g.position.set(4.1,0,ROWS.dock);parent.add(g);
    block(g,1.5,0.16,1.3,'#d4c8b4',0,0,0);
    const cap=mesh(g,geo('runcap',()=>new THREE.CylinderGeometry(0.5,0.54,0.24,32)),mat(PALETTE.run),0,0.28,0);
    const tri=geo('play',()=>{const s=new THREE.Shape();s.moveTo(-0.13,-0.18);s.lineTo(0.21,0);s.lineTo(-0.13,0.18);s.closePath();const e=new THREE.ExtrudeGeometry(s,{depth:0.04,bevelEnabled:false});e.rotateX(-Math.PI/2);return e;});
    mesh(g,tri,mat('#ffffff'),0,0.4,0,{shadow:false});
    const lampMat=ownMat('#fbbf24',{emissive:new THREE.Color('#f59e0b'),emissiveIntensity:0.35});
    block(g,0.07,0.6,0.07,'#6b7280',-0.62,0.16,-0.45);
    const lamp=mesh(g,geo('lamp',()=>new THREE.SphereGeometry(0.13,16,10)),lampMat,-0.62,0.86,-0.45);
    addHit(g,1.5,0.8,1.3,0,0.4,0,{type:'run'},'run');
    return {cap,lampMat,lamp};
  }

  function build(o){
    killTweens();
    for(const child of [...world.children])world.remove(child);
    for(const m of owned.splice(0))m.dispose();
    pickables=[];
    const specs=rowSpecs(o),n1=o.dials.s1,n2=o.dials.s2,studio=o.kind==='studio';
    // Floor, zones and cost bar track.
    block(world,11.2,0.4,9.1,PALETTE.floorEdge,0,-0.42,0);
    block(world,10.9,0.06,8.8,PALETTE.floor,0,-0.06,0);
    block(world,10.4,0.02,1.55,PALETTE.mat,0,0,ROWS.intake-0.35);
    block(world,10.4,0.02,1.6,PALETTE.dock,0,0,ROWS.dock-0.05);
    block(world,BAR_LENGTH+0.3,0.08,0.66,'#3f3a33',0,0,ROWS.bar);
    // Stations.
    const s1Units=[],s2Units=[];
    for(let i=0;i<n1;i++){const g=new THREE.Group();g.position.set(unitX(specs.s1,i),0,ROWS.s1);world.add(g);s1Units.push({g,parts:studio?press(g,o.ink):bench(g)});}
    for(let i=0;i<n2;i++){const g=new THREE.Group();g.position.set(unitX(specs.s2,i),0,ROWS.s2);world.add(g);s2Units.push({g,parts:studio?tunnel(g):wok(g)});}
    const syncSpec=o.syncStation==='s1'?specs.s1:specs.s2,syncN=o.syncStation==='s1'?n1:n2;
    cables(world,o,syncSpec,syncN);
    // Add / remove affordances (only where this week allows a change).
    for(const [key,spec,n,row] of [['s1',specs.s1,n1,ROWS.s1],['s2',specs.s2,n2,ROWS.s2]]){
      const [min,max]=o.limits[key];
      if(n<max)ghost(world,spec,unitX(spec,n),row,{type:'set',key,value:n+1},'add-'+key);
      if(n>min)minusToken(world,spec,unitX(spec,n-1),row,{type:'set',key,value:n-1},'remove-'+key);
    }
    // Week 1: order pads at intake.
    if(o.orderChoices)o.orderChoices.forEach((v,i)=>{
      const p=intakeSlot(i,3);const pad=block(world,0.78,0.03,0.78,i<o.dials.orders/10?o.ink:'#d6ccba',p.x,0.01,p.z);pad.receiveShadow=true;
      addHit(world,0.85,0.6,0.95,p.x,0.3,p.z,{type:'set',key:'orders',value:v},'orders-'+v);
    });
    const runBtn=runButton(world);
    // Cost bar segments and revenue flag.
    const bar={};
    for(const key of ['lease','s1Cost','s2Cost','sync','variable']){
      const color={lease:PALETTE.lease,s1Cost:PALETTE.s1,s2Cost:PALETTE.s2,sync:PALETTE.sync,variable:PALETTE.variable}[key];
      bar[key]=mesh(world,boxGeo(1,0.3,0.46),mat(color),0,0.23,ROWS.bar);bar[key].visible=false;
    }
    const flag=new THREE.Group();flag.position.set(BAR_LEFT,0,ROWS.bar+0.42);world.add(flag);
    block(flag,0.05,0.95,0.05,'#14532d',0,0,0);block(flag,0.46,0.26,0.03,PALETTE.revenue,0.25,0.66,0);
    const revStrip=mesh(world,boxGeo(1,0.05,0.12),mat(PALETTE.revenue),0,0.1,ROWS.bar+0.42,{shadow:false});revStrip.visible=false;
    // Pallets: each one is 10 units from the model.
    const result=dayResultFromObserved(o),P=result.entered/10,D=result.done/10;
    const pallets=[];for(let i=0;i<P;i++){const p=palletMesh(o);world.add(p.g);pallets.push(p);}
    view={o,specs,s1Units,s2Units,runBtn,bar,flag,revStrip,pallets,schedule:schedule(o,specs,result,P,D),result,P,D};
    pickables.forEach(p=>p.updateMatrixWorld(true));
    fit();
  }
  const dayResultFromObserved=o=>o.result||o.preview;

  // ----- Deterministic playback schedule: pallet i's path and timing -----
  function intakeSlot(i,P){const perRow=P>12?Math.ceil(P/2):Math.max(P,3),row=Math.floor(i/perRow),col=i%perRow,sp=Math.min(0.82,9.4/perRow);return {x:-(perRow-1)*sp/2+col*sp,z:ROWS.intake-row*0.72};}
  function dockSlot(i){const col=i%8,row=Math.floor(i/8)%2,layer=Math.floor(i/16);return {x:-4.65+col*0.74,y:layer*0.36,z:ROWS.dock+0.32-row*0.7};}
  function pileSlot(i){const col=i%3,row=Math.floor(i/3)%2,layer=Math.floor(i/6);return {x:3.35+col*0.68,y:layer*0.36,z:ROWS.pile+0.34-row*0.66};}
  function schedule(o,specs,r,P,D){
    const gap=Math.min(0.42,Math.max(0.12,2.6/Math.max(P,1))),n1=o.dials.s1,n2=o.dials.s2,s1Top=specs.s1.type==='press'?0.55:0.6;
    const items=[];
    for(let i=0;i<P;i++){
      const u=Math.min(n1-1,Math.floor(i/Math.max(1,r.cap1/n1/10))),cured=i<D,j=cured?Math.min(n2-1,Math.floor(i/Math.max(1,r.cap2/n2/10))):null,a0=i*gap;
      const intake=intakeSlot(i,P),sx=unitX(specs.s1,u);
      const k={i,u,j,cured,a0,a1:a0+0.38,a2:a0+0.7,a3:a0+1.05,a4:a0+1.4,a5:a0+1.75};
      k.points=[{x:intake.x,y:0.02,z:intake.z},{x:sx,y:s1Top,z:ROWS.s1+0.12},{x:sx,y:s1Top,z:ROWS.s1+0.12}];
      if(cured){
        const tx=unitX(specs.s2,j),dock=dockSlot(i),wokTop=specs.s2.type==='wok'?0.58:0.16;
        k.points.push({x:tx,y:wokTop,z:ROWS.s2+0.55},{x:tx,y:wokTop,z:ROWS.s2-0.15},{x:dock.x,y:0.02+dock.y,z:dock.z});
      }else{
        const pile=pileSlot(i-D);k.points.push({x:pile.x,y:0.02+pile.y,z:pile.z});
      }
      items.push(k);
    }
    const T=P?Math.max(...items.map(k=>k.cured?k.a5:k.a3))+0.05:0;
    return {items,T,gap};
  }
  const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
  function lerpPoint(a,b,t){const e=ease(t);return {x:a.x+(b.x-a.x)*e,y:a.y+(b.y-a.y)*e+Math.sin(Math.PI*e)*0.22,z:a.z+(b.z-a.z)*e};}
  function palletPose(k,t){
    const p=k.points,seg=(from,to,t0,t1)=>lerpPoint(p[from],p[to],(t-t0)/(t1-t0));
    if(t<=k.a0)return {pos:p[0],stage:0};
    if(t<k.a1)return {pos:seg(0,1,k.a0,k.a1),stage:0};
    if(t<k.a2)return {pos:p[1],stage:t>(k.a1+k.a2)/2?1:0,busy1:(t-k.a1)/(k.a2-k.a1)};
    if(!k.cured){if(t<k.a3)return {pos:seg(2,3,k.a2,k.a3),stage:1};return {pos:p[3],stage:1,stuck:true};}
    if(t<k.a3)return {pos:seg(2,3,k.a2,k.a3),stage:1};
    if(t<k.a4)return {pos:seg(3,4,k.a3,k.a4),stage:t>(k.a3+k.a4)/2?2:1,busy2:(t-k.a3)/(k.a4-k.a3)};
    if(t<k.a5)return {pos:seg(4,5,k.a4,k.a5),stage:2};
    return {pos:p[5],stage:2,docked:true};
  }

  // Apply the scene at playback time t. t<0 means "not run yet" (pre-run setup).
  function apply(t){
    if(!view||disposed)return;
    const o=observed,result=o.result||o.preview,{s1Units,s2Units,runBtn,bar,flag,revStrip,pallets,schedule:sch,D}=view;
    const pre=t<0,studio=o.kind==='studio',final=!pre&&t>=sch.T;
    const loadMats=studio?[mat(PALETTE.blank),mat(o.ink),mat(PALETTE.kraft)]:[mat(PALETTE.raw),mat(PALETTE.prepped),mat(PALETTE.cooked)];
    let entered=0,done=0;const busy1=new Array(s1Units.length).fill(0),busy2=new Array(s2Units.length).fill(0);
    sch.items.forEach((k,i)=>{
      const pose=pre?{pos:k.points[0],stage:0}:palletPose(k,t),p=pallets[i];
      p.g.position.set(pose.pos.x,pose.pos.y,pose.pos.z);
      p.load.material=loadMats[pose.stage];p.tag.visible=Boolean(pose.stuck);
      if(!pre&&t>=k.a2)entered+=10;
      if(!pre&&k.cured&&t>=k.a5)done+=10;
      if(pose.busy1!==undefined)busy1[k.u]=Math.max(busy1[k.u],Math.sin(Math.PI*pose.busy1));
      if(pose.busy2!==undefined)busy2[k.j]=Math.max(busy2[k.j],Math.sin(Math.PI*pose.busy2));
    });
    if(final){entered=result.entered;done=result.done;}
    // Stations: stamping heads, tunnel glow, wok flames; idle units dim at the end of the day.
    s1Units.forEach((u,i)=>{if(u.parts.head)u.parts.head.position.y=u.parts.headY-0.42*busy1[i];setDim(u.g,final&&i>=s1Units.length-result.idle1);});
    s2Units.forEach((u,i)=>{
      if(u.parts.glow)u.parts.glow.emissiveIntensity=1.4*busy2[i];
      if(u.parts.flame)u.parts.flame.scale.setScalar(0.35+0.85*busy2[i]);
      setDim(u.g,final&&i>=s2Units.length-result.idle2);
    });
    // Cost bar: committed blocks are there before the first pallet; variable cost grows per pallet.
    const scale=BAR_LENGTH/o.maxScale,variableSoFar=o.variableRate*entered;
    const values=[['lease',result.lease],['s1Cost',result.s1Cost],['s2Cost',result.s2Cost],['sync',result.sync],['variable',pre?0:final?result.variable:variableSoFar]];
    let x=BAR_LEFT;
    for(const [key,value] of values){const m=bar[key];m.visible=value>0;if(value>0){const len=value*scale;m.scale.x=len;m.position.x=x+len/2;x+=len;}}
    const revenue=pre?0:o.price*done;
    flag.visible=revenue>0;flag.position.x=BAR_LEFT+revenue*scale;
    revStrip.visible=revenue>0;if(revenue>0){revStrip.scale.x=revenue*scale;revStrip.position.x=BAR_LEFT+revenue*scale/2;}
    runBtn.cap.material=mat(o.weekOver?PALETTE.runOff:PALETTE.run);
    paint();
    tiles(o,pre?null:{entered,done,cost:result.committed+(final?result.variable:variableSoFar),final});
    placeBadges(o,pre,final);
  }
  function setDim(group,dim){group.traverse(n=>{if(n.isMesh&&n.userData.tint)n.material=mat(n.userData.tint,{dim});});}

  // ----- Camera fit to a constant box, and projected HTML badges -----
  function fit(){
    const w=Math.max(worldEl.clientWidth,1),h=Math.max(worldEl.clientHeight,1);
    renderer.setSize(w,h,false);
    const narrow=w<600,az=THREE.MathUtils.degToRad(narrow?12:20),el=THREE.MathUtils.degToRad(narrow?48:44);
    camera.position.set(Math.sin(az)*Math.cos(el)*30,Math.sin(el)*30,Math.cos(az)*Math.cos(el)*30);camera.up.set(0,1,0);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const x of [VIEW.min.x,VIEW.max.x])for(const y of [VIEW.min.y,VIEW.max.y])for(const z of [VIEW.min.z,VIEW.max.z]){
      const v=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);
    }
    let hw=(maxX-minX)/2*1.02,hh=(maxY-minY)/2*1.02;const cx=(minX+maxX)/2,cy=(minY+maxY)/2,aspect=w/h;
    if(hw/hh>aspect)hh=hw/aspect;else hw=hh*aspect;
    Object.assign(camera,{left:cx-hw,right:cx+hw,top:cy+hh,bottom:cy-hh});camera.updateProjectionMatrix();
    world.updateMatrixWorld(true);
    info.pick_targets=pickables.filter(p=>p.userData.action).map(p=>{const v=p.getWorldPosition(new THREE.Vector3()).project(camera);return {name:p.userData.name,action:p.userData.action,x:(v.x+1)/2,y:(1-v.y)/2};});
  }
  function project(x,y,z){const v=new THREE.Vector3(x,y,z).project(camera);return {x:(v.x+1)/2*worldEl.clientWidth,y:(1-v.y)/2*worldEl.clientHeight};}
  function placeBadges(o,pre,final){
    const specs=view.specs,list=[],r=o.result||o.preview,wide=worldEl.clientWidth>=400;
    const rowText=(key,n,idle)=>{const name=key==='s1'?o.s1Name:o.s2Name;return plural(n,name.one,name.many)+(final&&idle?' · '+idle+' idle':'');};
    if(wide){
      list.push({cls:'row',text:rowText('s1',o.dials.s1,r.idle1),at:project(unitX(specs.s1,0)-specs.s1.w/2,0.15,ROWS.s1+specs.s1.d/2+0.05),align:'left'});
      list.push({cls:'row',text:rowText('s2',o.dials.s2,r.idle2),at:project(unitX(specs.s2,0)-specs.s2.w/2,0.15,ROWS.s2+specs.s2.d/2+0.05),align:'left'});
    }
    if(final&&r.stuck)list.push({cls:'stuck',text:r.stuck+' '+o.units+' stuck'+(wide?' — never '+o.s2Name.verb:''),at:project(4.0,0.85,ROWS.pile),align:'center'});
    badges.innerHTML=list.map(b=>'<span class="pc-badge pc-badge-'+b.cls+'">'+esc(b.text)+'</span>').join('');
    // Keep every badge fully inside the scene: anchor it, then clamp to the stage edges.
    const W=worldEl.clientWidth;
    [...badges.children].forEach((el,i)=>{const b=list[i],w=el.offsetWidth,h=el.offsetHeight;let x=b.align==='center'?b.at.x-w/2:b.at.x-4,y=b.align==='center'?b.at.y-h:b.at.y-h/2;x=Math.min(Math.max(x,6),W-w-6);el.style.left=x.toFixed(1)+'px';el.style.top=Math.max(y,6).toFixed(1)+'px';});
  }
  const paint=()=>{if(!disposed)renderer.render(scene,camera);};

  // ----- DOM HUD -----
  function stepper(key,o){
    const name=key==='s1'?o.s1Name:o.s2Name,[min,max]=o.limits[key],n=o.dials[key];
    const cost=money(name.cost)+'/day '+(name.included?'each extra · first included':'each');
    return '<div class="pc-stepper" role="group" aria-label="'+esc(cap(name.many))+'"><div class="pc-stepper-name"><strong>'+esc(cap(name.many))+'</strong><small>Each '+esc(name.does)+' '+name.cap+'/day · '+cost+'</small></div>'
      +'<div class="pc-stepper-controls"><button id="pc-'+key+'-minus" data-pc="set" data-key="'+key+'" data-value="'+(n-1)+'" aria-label="One fewer '+esc(name.one)+'"'+(n<=min?' disabled':'')+'>−</button><output id="pc-'+key+'-value" aria-live="polite">'+n+'</output><button id="pc-'+key+'-plus" data-pc="set" data-key="'+key+'" data-value="'+(n+1)+'" aria-label="One more '+esc(name.one)+'"'+(n>=max?' disabled':'')+'>+</button></div></div>';
  }
  function dials(o){
    if(o.orderChoices)return '<div class="pc-orders" role="group" aria-label="Hoodies to accept"><span>Hoodies to accept</span><div>'+o.orderChoices.map(v=>'<button id="pc-orders-'+v+'" data-pc="set" data-key="orders" data-value="'+v+'" aria-pressed="'+(o.dials.orders===v)+'">'+v+'</button>').join('')+'</div></div><p class="pc-fixed-note">This week: 1 press (prints 30/day) and 1 tunnel (cures 40/day).</p>';
    const fixed=o.limits.s1[0]===o.limits.s1[1]&&o.limits.s2[0]===o.limits.s2[1];
    return fixed?'':stepper('s1',o)+stepper('s2',o);
  }
  function tiles(o,live){
    const r=o.result||o.preview,u=o.unit,set=(id,label,value,cls='')=>{const el=$(id);el.querySelector('span').textContent=label;el.querySelector('strong').textContent=value;el.dataset.tone=cls;};
    if(!live){
      set('pc-tile-cured',o.orderChoices?'Sold / accepted':o.levelId==='size'?'Sold':'Sold / orders','—');set('pc-tile-cost','Day cost','—');set('pc-tile-avg','Cost per '+u,'—');set('pc-tile-profit','Profit','—');
      $('pc-outcome').textContent=o.weekOver?'Week over.':'Not run yet. '+money(r.committed)+' is committed before the first '+u+'.';
      $('pc-outcome').dataset.tone='';return;
    }
    const cost=live.cost;
    set('pc-tile-cured',o.orderChoices?'Sold / accepted':o.levelId==='size'?'Sold':'Sold / orders',o.levelId==='size'?String(live.done):live.done+' / '+r.orders);
    set('pc-tile-cost','Day cost',money(cost));
    set('pc-tile-avg','Cost per '+u+(live.final?'':' so far'),live.done?money2(cost/live.done):'—');
    set('pc-tile-profit','Profit',live.final?signed(r.profit):'…',live.final?(r.profit>0?'good':r.profit<0?'bad':''):'');
    $('pc-outcome').textContent=live.final?DAYS[o.lastDay]+': '+o.outcome+'.':'Running '+DAYS[o.lastDay]+'…';
    $('pc-outcome').dataset.tone=live.final?(r.stuck||r.unfilled?'bad':r.profit>0?'good':''):'';
  }
  function ledger(o,star=false){
    const W=Math.max(280,Math.round($('pc-chart').clientWidth||320)),H=200,L=50,R=W-14,Tp=18,B=152,pts=o.ledger;
    const cats=o.chartX==='orders'?o.orderChoices:Array.from({length:o.limits[o.chartX][1]},(_,i)=>i+1);
    const xOf=v=>L+(cats.indexOf(v)+0.5)*(R-L)/cats.length;
    const axisName=o.chartX==='orders'?'Hoodies accepted':o.chartX==='s1'?cap(o.s1Name.many)+' leased':cap(o.s2Name.many)+' leased';
    let svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-labelledby="pc-ledger-title pc-ledger-desc"><title id="pc-ledger-title">Your ledger</title><desc id="pc-ledger-desc">'+esc(pts.length?pts.map(p=>DAYS[p.day]+(p.current?'':' (earlier attempt)')+': '+describeSetup(o,p)+', '+money2(p.average)+' per '+o.unit+', profit '+signed(p.profit)).join('; '):'No days run yet.')+'</desc>';
    cats.forEach(c=>{svg+='<text x="'+xOf(c).toFixed(1)+'" y="'+(B+16)+'" class="pc-ax" text-anchor="middle">'+c+'</text>';});
    svg+='<text x="'+((L+R)/2)+'" y="'+(B+34)+'" class="pc-axname" text-anchor="middle">'+esc(axisName)+'</text>';
    svg+='<line x1="'+L+'" x2="'+R+'" y1="'+B+'" y2="'+B+'" class="pc-axis"/>';
    if(!pts.length){svg+='<text x="'+((L+R)/2)+'" y="'+((Tp+B)/2)+'" class="pc-empty" text-anchor="middle">Run a day to plot it here.</text></svg>';return svg;}
    const vals=pts.map(p=>p.average/100);let lo=Math.min(...vals),hi=Math.max(...vals);
    if(hi-lo<2){const m=(hi+lo)/2;lo=m-1;hi=m+1;}
    const span=hi-lo,step=[0.5,1,2,2.5,5,10,20].find(s=>span/s<=5)||20;lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;
    const yOf=v=>B-(v-lo)/(hi-lo)*(B-Tp);
    for(let v=lo;v<=hi+1e-9;v+=step){svg+='<line x1="'+L+'" x2="'+R+'" y1="'+yOf(v).toFixed(1)+'" y2="'+yOf(v).toFixed(1)+'" class="pc-grid"/><text x="'+(L-6)+'" y="'+(yOf(v)+4).toFixed(1)+'" class="pc-ax" text-anchor="end">£'+(Number.isInteger(v)?v:v.toFixed(1))+'</text>';}
    svg+='<text x="12" y="'+((Tp+B)/2)+'" class="pc-axname" text-anchor="middle" transform="rotate(-90 12 '+((Tp+B)/2)+')">Cost per '+esc(o.unit)+'</text>';
    const groups=new Map();pts.forEach(p=>{const k=p[o.chartX];groups.set(k,[...(groups.get(k)||[]),p]);});
    for(const [k,group] of groups)group.forEach((p,i)=>{
      const x=xOf(k)+(i-(group.length-1)/2)*Math.min(13,(R-L)/cats.length/Math.max(group.length,1)),y=yOf(p.average/100),ok=!p.stuck&&!p.unfilled;
      svg+='<g class="pc-dot'+(p.current?'':' pc-old')+'"><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="5.5" class="'+(p.classification==='underused'?'pc-underused':p.classification==='idle'?'pc-idle':p.classification==='bottleneck'?'pc-waste':ok?'pc-filled':'pc-hollow')+'"/>'+(p.stuck?'<line x1="'+(x-4).toFixed(1)+'" x2="'+(x+4).toFixed(1)+'" y1="'+(y+9).toFixed(1)+'" y2="'+(y+9).toFixed(1)+'" class="pc-tick"/>':'')+'<text x="'+x.toFixed(1)+'" y="'+(y-9).toFixed(1)+'" class="pc-day" text-anchor="middle">'+DAY_SHORT[p.day]+'</text></g>';
    });
    if(star&&o.result){const k=o.dials[o.chartX],x=xOf(k),y=yOf(o.result.average/100);svg+='<path class="pc-star" d="'+starPath(x,y-1,11,5)+'"/>';}
    return svg+'</svg>';
  }
  function describeSetup(o,p){
    if(o.chartX==='orders')return p.orders+' '+o.units;
    return plural(p.s1,o.s1Name.one,o.s1Name.many)+' and '+plural(p.s2,o.s2Name.one,o.s2Name.many);
  }
  function ledgerDetails(o){
    return '<p class="pc-fixed-note">These are individual experiments, not a long-run average-cost curve. Compare both stations and utilisation.</p>'+o.ledger.map(p=>'<details class="pc-run-detail"><summary>'+esc(DAYS[p.day])+' · '+esc(describeSetup(o,p))+' · '+money2(p.average)+'/unit · '+esc(p.classification==='bottleneck'?'Bottleneck / wasted work':p.classification==='idle'?'Idle extra stations':p.classification==='underused'?'Partly used capacity':'Balanced, efficient run')+'</summary><p>'+esc(describeSetup(o,p))+'; capacities '+p.cap1+' / '+p.cap2+'; output '+p.done+'; stuck '+p.stuck+'; idle stations '+p.idle1+' / '+p.idle2+'; total cost '+money(p.total)+'; profit '+signed(p.profit)+'. '+(p.current?'Current attempt.':'Earlier attempt.')+(p.prediction?' Prediction '+p.prediction.value+'; observed '+p.prediction.actual+' ('+money2(p.prediction.referenceAverage)+' → '+money2(p.prediction.average)+').':'')+'</p></details>').join('');
  }
  function think(o){
    const reference=o.predictionReference;
    $('pc-prediction').hidden=!o.predictionRequired;
    $('pc-prediction').innerHTML=o.predictionRequired?'<p><b>Before this test:</b> compared with '+esc(describeSetup(o,reference))+', '+money2(reference.average)+' per '+esc(o.unit)+', what will happen to cost per '+esc(o.unit)+'?</p><div class="pc-prediction-options">'+o.predictionOptions.map(([id,label])=>'<button id="pc-predict-'+id+'" data-pc="predict" data-value="'+id+'" aria-pressed="'+(o.prediction===id)+'">'+esc(label)+'</button>').join('')+'</div>':'';
    const pf=o.predictionFeedback;
    $('pc-prediction-feedback').textContent=pf?'Your prediction: '+pf.value+'. Observed: '+pf.actual+' ('+money2(pf.referenceAverage)+' → '+money2(pf.average)+'). '+(pf.correct?'Matched.':'Revise your explanation using the result.'):'';
    $('pc-comparison').hidden=!o.comparisonRequired;
    $('pc-comparison').innerHTML=o.comparisonRequired?'<p><b>Select your evidence pair.</b> Choose the efficient run you think is best, then a larger efficient run that tests whether growing still helps. Each row shows both stations.</p>'+['baseline','larger'].map(key=>'<label>'+ (key==='baseline'?'Your best efficient run':'Larger efficient studio')+'<select id="pc-compare-'+key+'" data-compare="'+key+'"><option value="" disabled>Choose a test day…</option>'+o.comparisonOptions.map(p=>'<option value="'+p.id+'" '+(o.comparison[key]===p.id?'selected':'')+'>'+esc(DAYS[p.day]+' · '+describeSetup(o,p)+' · '+p.done+' sold · '+money2(p.average)+' each · '+p.classification)+'</option>').join('')+'</select></label>').join('')+'<p class="pc-selected-pair">'+['baseline','larger'].map(key=>{const p=o.comparisonOptions.find(p=>p.id===o.comparison[key]);return p?esc(describeSetup(o,p))+': '+p.done+' output, '+money(p.total)+' cost, '+signed(p.profit)+' profit, '+money2(p.average)+'/unit':'No '+key+' selected';}).join('<br>')+'</p>':'';

    $('pc-question').textContent=o.gateOpen?o.question:'Your question';
    $('pc-gate').textContent=o.gateOpen?'':o.gate;$('pc-gate').hidden=o.gateOpen;
    $('pc-reasons').innerHTML=o.gateOpen?o.reasons.map(([id,text])=>'<button id="pc-reason-'+id+'" data-pc="reason" data-value="'+id+'" aria-pressed="'+(o.reason===id)+'">'+esc(text)+'</button>').join(''):'';
    $('pc-hint').hidden=!o.help;$('pc-hint').textContent=o.hint;$('pc-help').hidden=o.help;
    $('pc-next').hidden=true;
  }
  function finish(o){
    $('pc-finish-list').innerHTML=o.history.map((h,i)=>'<li><span>Week '+(i+1)+' · '+esc(h.week)+'</span><strong>'+esc(i===0?h.orders+' hoodies':i===4?plural(h.s2,'wok','woks')+', '+plural(h.s1,'bench','benches'):plural(h.s1,'press','presses')+', '+plural(h.s2,'tunnel','tunnels'))+'</strong><em>'+money2(h.average)+' per '+esc(h.unit)+' · '+signed(h.profit)+(h.help?' · hint used':'')+'</em></li>').join('');
  }

  function render(o,time=0,{seeking=false}={}){
    if(disposed)return;
    const active=document.activeElement?.id;
    const levelChanged=observed?.level!==o.level||observed?.complete!==o.complete;
    observed=o;
    surface.dataset.kind=o.kind;
    $('pc-kicker').textContent=o.complete?'Five weeks complete':'Week '+o.week+' of '+o.weeks;
    $('pc-title').textContent=o.complete?'Grow for a reason':o.title;
    $('pc-client').textContent=o.complete?'Three rules carried you through five weeks: spread fixed costs, find the bottleneck, and stop growing when coordination costs outrun the saving.':o.client;
    $('pc-goal').textContent=o.complete?'':'Goal: '+o.goal;$('pc-goal').hidden=o.complete;
    $('pc-cash').textContent=o.complete?'':'Six test days · reset allowed';
    $('pc-days').innerHTML=o.complete?'':DAY_SHORT.map((d,i)=>'<li data-state="'+(i<o.day?'done':i===o.day?'next':'')+'" title="'+DAYS[i]+'">'+d+'</li>').join('');
    $('pc-days').setAttribute('aria-label',o.daysLeft+' of 6 days left this week');
    $('pc-main').hidden=o.complete;$('pc-finish').hidden=!o.complete;
    if(o.complete){finish(o);killTweens();if(active)app.querySelector('#'+active)?.focus({preventScroll:true});if(levelChanged&&!seeking)$('pc-title').focus({preventScroll:true});return;}
    const b=o.preview;
    $('pc-preview').innerHTML='<span><b>'+money(b.committed)+'</b> committed today</span><span>Can '+esc(o.s1Name.can)+' <b>'+b.cap1+'</b></span><span>Can '+esc(o.s2Name.can)+' <b>'+b.cap2+'</b></span><span>'+(o.levelId==='size'?'Buyer takes up to <b>200</b>':'Orders <b>'+b.orders+'</b>')+'</span><span>Price <b>'+money(o.price)+'</b></span>';
    $('pc-dials').innerHTML=dials(o);
    const runLabel=o.weekOver?'Week over':o.predictionRequired&&!o.prediction?'Predict above, then run':(o.kind==='noodles'?'Open the stall · ':'Run ')+o.nextDay;
    $('pc-run').textContent=runLabel;$('pc-run').disabled=o.weekOver||(o.predictionRequired&&!o.prediction);
    $('pc-weekover').hidden=!o.weekOver;
    $('pc-legend').innerHTML=[[PALETTE.lease,o.baseLabel],[PALETTE.s1,o.kind==='studio'?'Presses':'Extra benches'],[PALETTE.s2,o.kind==='studio'?'Extra tunnels':'Woks'],[PALETTE.sync,o.syncLabel],[PALETTE.variable,o.variableLabel],[PALETTE.revenue,'Revenue flag']].map(([c,t])=>'<span><i style="background:'+c+'"></i>'+esc(t)+'</span>').join('');
    $('pc-chart').innerHTML=ledger(o);
    $('pc-ledger-details').innerHTML=ledgerDetails(o);
    think(o);
    renderer.domElement.setAttribute('aria-label',(o.kind==='studio'?'Print studio floor':'Noodle stall')+': '+plural(o.dials.s1,o.s1Name.one,o.s1Name.many)+', '+plural(o.dials.s2,o.s2Name.one,o.s2Name.many)+'. '+(o.result?o.outcome:'Not run yet')+'. Every scene action has a button beside the scene.');
    // Rebuild the floor when the week or the setup changes; replay a fresh run, otherwise draw a still frame.
    const nextSignature=[o.level,o.attempt,o.dials.orders,o.dials.s1,o.dials.s2,o.weekOver&&!o.matches].join(':');
    // A run is replayed only when it is exactly one new day in the same week, and never while seeking.
    const dayAdvanced=previous&&previous.level===o.level&&o.day===previous.day+1;
    const freshRun=!seeking&&!reduced()&&o.matches&&previous&&previous.level===o.level&&previous.attempt===o.attempt&&o.day===previous.day+1;
    previous={level:o.level,attempt:o.attempt,day:o.day};
    if(nextSignature!==signature||seeking||freshRun){signature=nextSignature;build(o);}
    if(freshRun)play();else{killTweens();apply(o.matches?view.schedule.T:-1);}
    if(levelChanged&&!seeking&&o.week>1)$('pc-title').focus({preventScroll:false});
    else if(active&&!seeking){const el=app.querySelector('#'+active);if(el&&!el.disabled)el.focus({preventScroll:true});else if(active==='pc-run')$('pc-run').focus({preventScroll:true});}
    if(dayAdvanced&&!seeking&&!freshRun)revealResult();
  }
  function play(){
    killTweens();clock={t:0};apply(0);
    tween=gsap.to(clock,{t:view.schedule.T,duration:view.schedule.T,ease:'none',onUpdate:()=>apply(clock.t),onComplete:()=>{tween=null;apply(view.schedule.T);revealResult();}});
  }
  function killTweens(){if(tween){tween.kill();tween=null;}if(pulse){pulse.kill();pulse=null;}}
  function onAssessment(a){
    if(!observed||observed.complete||!view)return;
    $('pc-next').hidden=!a.correct;
    if(a.correct){
      $('pc-next').textContent=observed.level===LEVELS.length-1?'See your five weeks →':'Start week '+(observed.week+1)+' →';
      $('pc-chart').innerHTML=ledger(observed,true);
      view.runBtn.lampMat.color.set('#4ade80');view.runBtn.lampMat.emissive.set('#22c55e');view.runBtn.lampMat.emissiveIntensity=0.9;paint();
      if(!reduced()){killTweens();const lamp=view.runBtn.lamp;pulse=gsap.fromTo(lamp.scale,{x:1,y:1,z:1},{x:1.6,y:1.6,z:1.6,duration:0.35,yoyo:true,repeat:3,onUpdate:paint,onComplete:()=>{lamp.scale.setScalar(1);paint();pulse=null;}});}
      $('pc-next').focus({preventScroll:true});
    }
  }

  // ----- Input: buttons and 3D picking -----
  function onClick(event){
    const b=event.target.closest('[data-pc]');if(!b||b.disabled)return;
    const kind=b.dataset.pc;
    if(kind==='set')dispatch({type:'set',key:b.dataset.key,value:Number(b.dataset.value)});
    else if(kind==='predict')dispatch({type:'predict',value:b.dataset.value});
    else if(kind==='reason')dispatch({type:'reason',value:b.dataset.value});
  }
  surface.addEventListener('click',onClick);
  const onCompare=e=>{if(e.target.dataset.compare)dispatch({type:'compare',key:e.target.dataset.compare,value:e.target.value});};
  surface.addEventListener('change',onCompare);
  $('pc-run').addEventListener('click',()=>dispatch({type:'run'}));
  $('pc-retry').addEventListener('click',()=>dispatch({type:'retry'}));
  $('pc-help').addEventListener('click',()=>dispatch({type:'help'}));
  $('pc-next').addEventListener('click',()=>dispatch({type:'next'}));
  $('pc-again').addEventListener('click',()=>dispatch({type:'restart'}));
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  function hit(e){
    const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);
    const h=ray.intersectObjects(pickables,false).find(x=>x.object.userData.action);return h?h.object.userData.action:null;
  }
  const onDown=e=>{down={x:e.clientX,y:e.clientY};};
  const onUp=e=>{
    if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>10){down=null;return;}down=null;
    const action=hit(e);if(!action||!observed||observed.complete)return;
    if(action.type==='run'&&observed.weekOver)return;
    if(action.type==='run'&&observed.predictionRequired&&!observed.prediction){$('pc-prediction').querySelector('button')?.focus();return;}
    dispatch(action);
  };
  const onMove=e=>{renderer.domElement.style.cursor=hit(e)?'pointer':'default';};
  const onCancel=()=>{down=null;};
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('pointermove',onMove);renderer.domElement.addEventListener('pointercancel',onCancel);
  const resizeObserver=new ResizeObserver(()=>{if(!view||disposed)return;fit();apply(tween?clock.t:observed?.matches?view.schedule.T:-1);});
  resizeObserver.observe(worldEl);

  return {
    render,onAssessment,info,
    dispose(){
      disposed=true;killTweens();resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('pointercancel',onCancel);
      surface.removeEventListener('click',onClick);surface.removeEventListener('change',onCompare);
      for(const g of geos.values())g.dispose();for(const m of mats.values())m.dispose();for(const m of owned)m.dispose();
      renderer.dispose();renderer.forceContextLoss?.();
      for(const home of adopted){home.parent.insertBefore(home.el,home.next&&home.next.parentNode===home.parent?home.next:null);home.el.textContent=home.text;}
      readout?.classList.remove('pc-sr');if(pill)pill.textContent=pillText;
      surface.remove();style.remove();app.classList.remove('press-club');
    }
  };
}

const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function starPath(cx,cy,R,r){let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r:R;d+=(i?'L':'M')+(cx+Math.cos(a)*rad).toFixed(1)+' '+(cy+Math.sin(a)*rad).toFixed(1);}return d+'Z';}

const TEMPLATE=`
<header class="pc-week">
  <div class="pc-week-top"><span class="pc-kicker" id="pc-kicker"></span><span class="pc-cash" id="pc-cash"></span></div>
  <h2 id="pc-title" tabindex="-1"></h2>
  <p class="pc-client" id="pc-client"></p>
  <div class="pc-goal-row"><p class="pc-goal" id="pc-goal"></p><ol class="pc-days" id="pc-days"></ol></div>
</header>
<div class="pc-main" id="pc-main">
  <section class="pc-stage" aria-label="Studio floor">
    <div class="pc-world" id="pc-world"><div class="pc-badges" id="pc-badges" aria-hidden="true"></div></div>
    <p class="pc-legend" id="pc-legend" aria-label="Cost bar colours"></p>
    <details class="pc-card pc-ledger"><summary>Your experiment ledger & exact run details</summary><div id="pc-chart" class="pc-chart"></div><p class="pc-key"><span><i class="k-filled"></i>balanced / efficient</span><span><i class="k-idle"></i>idle extra stations</span><span><i class="k-underused"></i>partly used capacity</span><span><i class="k-hollow"></i>bottleneck / waste</span><span><i class="k-tick"></i>stuck pile</span></p><div id="pc-ledger-details"></div></details>
  </section>
  <section class="pc-side">
    <div class="pc-card pc-setup">
      <p class="pc-preview" id="pc-preview"></p>
      <div id="pc-dials" class="pc-dials"></div>
      <div id="pc-prediction" class="pc-prediction" hidden></div><button id="pc-run" class="pc-run"></button>
      <div id="pc-weekover" class="pc-weekover" hidden><p>All six test days are used. Reset this experiment freely; earlier evidence stays on the ledger, faded.</p><button id="pc-retry">Restart this week</button></div>
    </div>
    <div class="pc-card pc-result">
      <p class="pc-outcome" id="pc-outcome" role="status"></p>
      <p id="pc-prediction-feedback" class="pc-prediction-feedback"></p><div class="pc-tiles">
        <div id="pc-tile-cured"><span></span><strong></strong></div>
        <div id="pc-tile-cost"><span></span><strong></strong></div>
        <div id="pc-tile-avg"><span></span><strong></strong></div>
        <div id="pc-tile-profit"><span></span><strong></strong></div>
      </div>
    </div>
    <div class="pc-card pc-think">
      <div id="pc-comparison" class="pc-comparison" hidden></div><h3 id="pc-question"></h3>
      <p id="pc-gate" class="pc-gate"></p>
      <div id="pc-reasons" class="pc-reasons" role="group" aria-labelledby="pc-question"></div>
      <div class="pc-checkrow"><span id="pc-check-slot"></span><button id="pc-help" class="pc-quiet">Hint</button></div>
      <p id="pc-hint" class="pc-hint" hidden></p>
      <span id="pc-feedback-slot"></span>
      <button id="pc-next" class="pc-next" hidden></button>
    </div>
  </section>
</div>
<section class="pc-finish" id="pc-finish" hidden>
  <ol id="pc-finish-list" class="pc-finish-list"></ol>
  <div class="pc-ideas"><p><b>Spread fixed costs.</b> A cost you pay whatever you make gets cheaper per unit the more you make.</p><p><b>Find the bottleneck.</b> Output is set by the slowest step; capacity anywhere else only adds cost.</p><p><b>Grow for a reason.</b> Size helps until coordination costs outrun the saving — and the right size moves with demand.</p></div>
  <button id="pc-again" class="pc-run">Play again</button>
</section>
<footer class="pc-foot"><span id="pc-reset-slot"></span><span id="pc-readout-slot"></span>
  <details><summary>How this studio is modelled</summary>
    <p><b>Print studio (weeks 1–4).</b> Studio lease £480/day, includes one curing tunnel. Each press £60/day, prints 30 shirts. Each extra tunnel £60/day, cures 40. Sync: £60/day for every pair of press teams (n × (n − 1) ÷ 2 pairs). Blanks & ink £4 per shirt printed.</p>
    <p>Printed = the smaller of orders and press capacity. Sold = the smaller of printed and tunnel capacity. Shirts printed but not cured are paid for and worth nothing that day. Cost per shirt = day cost ÷ shirts sold. Profit = price × sold − day cost.</p>
    <p><b>Noodle stall (week 5).</b> Pitch £200/day, includes one prep bench; extra bench £60, preps 80 bowls. Wok £45/day, cooks 50. Sync £35 per pair of cooks. Ingredients £2.40 per bowl prepped. 150 bowls at £6.</p>
    <p>All figures are invented for teaching. Leases are fresh each day, so shrinking costs nothing here; equipment you’ve already bought would be different. The sync rule stands in for coordination overhead and is not a real business law. Bulk discounts, demand changes within a day, inventory, wages and tax are left out. Finishing a week is one good response, not proof of mastering scale.</p>
  </details>
</footer>`;

const CSS=`
.press-club{--pc-bg:#fbf7f0;--pc-ink:#1c2433;--pc-soft:#5b6474;--pc-card:#ffffff;--pc-line:#e6ddcf;--pc-accent:#2bb3a3;--pc-accent-ink:#0f5f57;--pc-good:#15803d;--pc-bad:#b91c1c;--pc-chip:#f3ede3;max-width:1240px;padding:22px 28px;color:var(--pc-ink)}
body:has(.press-club){background:var(--pc-page,#fbf7f0)}
@media (prefers-color-scheme:dark){body:has(.press-club){--pc-page:#141a2b}.press-club{--pc-bg:#141a2b;--pc-ink:#eef1f6;--pc-soft:#aab3c3;--pc-card:#1e2a44;--pc-line:#2e3b58;--pc-accent:#3cc7b6;--pc-accent-ink:#8ff0e3;--pc-good:#4ade80;--pc-bad:#f87171;--pc-chip:#26345299}}
.press-club .topbar{margin-bottom:6px}.press-club .brand{font-size:11px;letter-spacing:.14em}.press-club .pill{font-size:12px;border-color:var(--pc-line)}
.press-club .lesson-nav,.press-club .eyebrow,.press-club .panel,.press-club .stage-note{display:none}
.press-club h1{font-size:clamp(26px,3.2vw,38px);margin:8px 0 4px}.press-club .lede{font-size:15px;margin:0 0 14px;color:var(--pc-soft);max-width:900px}
.press-club .layout{display:block}.press-club .stage-wrap{border:0;border-radius:0;background:none;height:auto;min-height:0;overflow:visible}
.press-club .stage{height:auto;display:block;padding:0}.press-club .stage canvas{position:static;inset:auto;display:block;width:100%;height:100%}
.press-club .explain,.press-club .footer{color:var(--pc-soft)}
.pc{display:flex;flex-direction:column;gap:14px;font-family:ui-rounded,"Avenir Next","Segoe UI",system-ui,sans-serif}
.pc button{font:inherit;min-height:44px;border-radius:12px;border:1px solid var(--pc-line);background:var(--pc-card);color:var(--pc-ink);padding:8px 14px;cursor:pointer}
.pc button:hover:not(:disabled){border-color:var(--pc-accent)}.pc button:disabled{opacity:.45;cursor:not-allowed}
.pc button:focus-visible,.pc [tabindex]:focus-visible{outline:3px solid #eab308;outline-offset:3px}
.pc-week{background:var(--pc-card);border:1px solid var(--pc-line);border-radius:18px;padding:14px 18px}
.pc-week-top{display:flex;justify-content:space-between;gap:10px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--pc-soft);font-weight:700}
.pc-cash{letter-spacing:.02em;text-transform:none;font-size:13px;color:var(--pc-ink)}
.pc-week h2{font-size:clamp(22px,2.6vw,30px);margin:4px 0 2px;letter-spacing:-.02em}.pc-week h2:focus,.pc .pc-week h2:focus-visible{outline:none}
.pc-client{margin:0;color:var(--pc-soft);line-height:1.45;font-size:15px}
.pc-goal-row{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-top:10px}
.pc-goal{margin:0;background:var(--pc-chip);border-radius:999px;padding:7px 14px;font-weight:700;font-size:14px}
.pc-days{display:flex;gap:5px;list-style:none;margin:0;padding:0}.pc-days li{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:11px;font-weight:800;border:1px solid var(--pc-line);color:var(--pc-soft)}
.pc-days li[data-state=done]{background:var(--pc-ink);color:var(--pc-bg);border-color:var(--pc-ink)}.pc-days li[data-state=next]{border:2px solid var(--pc-accent);color:var(--pc-ink)}
.pc-main{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,1fr);gap:14px;align-items:start}
.pc-main[hidden],.pc-finish[hidden]{display:none}
.pc-stage{display:flex;flex-direction:column;gap:10px}.pc-legend{margin-top:-2px}
.pc-world{position:relative;aspect-ratio:16/10;border-radius:18px;overflow:hidden;border:1px solid var(--pc-line);background:#fbf7f0}
.pc-badges{position:absolute;inset:0;pointer-events:none}
.pc-badge{position:absolute;white-space:nowrap;font-size:12px;font-weight:800;padding:4px 9px;border-radius:999px;background:#ffffffee;color:#1c2433;box-shadow:0 1px 3px #0002}
.pc-badge-stuck{background:#dc2626;color:#fff}
.pc-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:8px 2px 0;font-size:12px;color:var(--pc-soft)}.pc-legend i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px;box-shadow:0 0 0 1px var(--pc-line)}
.pc-side{display:flex;flex-direction:column;gap:12px}
.pc-card{background:var(--pc-card);border:1px solid var(--pc-line);border-radius:16px;padding:14px}
.pc-card h3{margin:0 0 8px;font-size:15px}
.pc-preview{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px;font-size:13px}.pc-preview span{background:var(--pc-chip);border-radius:8px;padding:5px 8px}
.pc-dials{display:flex;flex-direction:column;gap:8px}
.pc-stepper{display:flex;justify-content:space-between;align-items:center;gap:10px}.pc-stepper-name{display:flex;flex-direction:column}.pc-stepper-name small{color:var(--pc-soft);font-size:12px}
.pc-stepper-controls{display:flex;align-items:center;gap:6px}.pc-stepper-controls button{width:44px;padding:0;font-size:22px;font-weight:700}.pc-stepper-controls output{min-width:26px;text-align:center;font-size:20px;font-weight:800}
.pc-orders{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.pc-orders span{font-weight:700}.pc-orders div{display:flex;gap:6px}.pc-orders button{min-width:56px;font-weight:800}
.pc button[aria-pressed=true]{background:var(--pc-accent);border-color:var(--pc-accent);color:#062a26}
.pc-fixed-note{margin:2px 0 0;font-size:12px;color:var(--pc-soft)}
.pc .pc-run{width:100%;margin-top:12px;min-height:50px;background:#16a34a;border-color:#15803d;color:#fff;font-weight:800;font-size:17px}.pc .pc-run:disabled{background:#9ca3af;border-color:#9ca3af}
.pc-weekover p{margin:10px 0 8px;font-size:14px}.pc-weekover button{width:100%}
.pc-outcome{margin:0 0 10px;font-weight:700;font-size:14px;min-height:20px}.pc-outcome[data-tone=bad]{color:var(--pc-bad)}.pc-outcome[data-tone=good]{color:var(--pc-good)}
.pc-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.pc-tiles div{background:var(--pc-chip);border-radius:12px;padding:9px 10px;min-width:0}
.pc-tiles span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--pc-soft);font-weight:700}.pc-tiles strong{display:block;font-size:19px;margin-top:3px;white-space:nowrap}
.pc-tiles div[data-tone=good] strong{color:var(--pc-good)}.pc-tiles div[data-tone=bad] strong{color:var(--pc-bad)}
.pc-chart svg{width:100%;height:auto;display:block}.pc-ax{font-size:10px;fill:var(--pc-soft)}.pc-axname{font-size:10px;fill:var(--pc-soft);font-weight:700}.pc-axis{stroke:var(--pc-line);stroke-width:1.5}.pc-grid{stroke:var(--pc-line);stroke-dasharray:2 3}
.pc-empty{font-size:12px;fill:var(--pc-soft)}.pc-filled{fill:#2bb3a3;stroke:#0f766e;stroke-width:1.5}.pc-hollow{fill:var(--pc-card);stroke:#0f766e;stroke-width:2}.pc-tick{stroke:#dc2626;stroke-width:3;stroke-linecap:round}
.pc-underused{fill:#c4b5fd;stroke:#7c3aed;stroke-width:2}.k-underused{background:#c4b5fd}.pc-idle{fill:#fbbf24;stroke:#a16207;stroke-width:2}.pc-waste{fill:var(--pc-card);stroke:#dc2626;stroke-width:2}.k-idle{background:#fbbf24}.pc-day{font-size:9px;font-weight:800;fill:var(--pc-ink)}.pc-old{opacity:.35}.pc-star{fill:#eab308;stroke:#a16207;stroke-width:1}
.pc-key{display:flex;flex-wrap:wrap;gap:4px 12px;margin:6px 0 0;font-size:11px;color:var(--pc-soft)}.pc-key i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px}
.k-filled{background:#2bb3a3}.k-hollow{border:2px solid #0f766e;box-sizing:border-box}.pc-key .k-tick{width:10px;height:3px;border-radius:2px;background:#dc2626;vertical-align:2px}
.pc-gate{margin:0;color:var(--pc-soft);font-size:14px;line-height:1.45}
.pc-reasons{display:flex;flex-direction:column;gap:7px}.pc-reasons button{text-align:left;line-height:1.35;padding:10px 12px}
.pc-checkrow{display:flex;gap:8px;margin-top:12px;align-items:stretch}.pc-checkrow #check{flex:1;min-height:46px;border-radius:12px;font-weight:800;background:var(--pc-ink);border-color:var(--pc-ink);color:var(--pc-bg)}
.pc .pc-quiet{background:none}
.pc-hint{margin:10px 0 0;font-size:14px;line-height:1.45;background:var(--pc-chip);padding:10px 12px;border-radius:10px}
.pc .feedback{min-height:0;padding-top:10px;font-size:14px;line-height:1.5;color:var(--pc-ink)}.pc .feedback[data-correct=true]{color:var(--pc-good)}.pc .feedback[data-correct=false]{color:var(--pc-bad)}
.pc .pc-next{width:100%;margin-top:10px;background:var(--pc-accent);border-color:var(--pc-accent);color:#062a26;font-weight:800}
.pc-finish{background:var(--pc-card);border:1px solid var(--pc-line);border-radius:18px;padding:18px}
.pc-finish-list{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:8px}.pc-finish-list li{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:8px;background:var(--pc-chip);border-radius:12px;padding:10px 12px;font-size:14px}
.pc-finish-list em{font-style:normal;color:var(--pc-soft)}.pc-ideas{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.pc-ideas p{margin:0;font-size:14px;line-height:1.45}
.pc-foot{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}.pc-foot details{flex:1;min-width:240px;font-size:13px;line-height:1.5;color:var(--pc-soft)}.pc-foot summary{cursor:pointer;font-weight:700;color:var(--pc-ink);min-height:44px;display:flex;align-items:center}
.pc-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:900px){.pc-main{display:flex;flex-direction:column}.pc-stage,.pc-side{display:contents}.pc-world{order:1;aspect-ratio:4/3;max-height:330px;width:100%}.pc-setup{order:2}.pc-result{order:3}.pc-think{order:4}.pc-legend{order:5;margin:0}.pc-ledger{order:6}}
@media (max-width:640px){.press-club{padding:14px 12px}.press-club .lede{display:none}.press-club .pill{display:none}.pc-week{padding:12px}.pc-client{font-size:14px}.pc-tiles{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.pc-tiles div{padding:7px 5px}.pc-tiles strong{font-size:16px}.pc-tiles span{font-size:9px;letter-spacing:0}.pc-finish-list li{grid-template-columns:1fr}.pc-ideas{grid-template-columns:1fr}.pc-days li{width:26px;height:26px}.pc-legend{font-size:11px;gap:4px 10px}}
@media (max-width:360px){.pc-stepper-name small{font-size:11px}.pc-tiles strong{font-size:17px}.pc-preview{font-size:12px;margin-bottom:8px}.pc-preview span{padding:4px 7px}.pc-fixed-note{display:none}.pc-week h2{font-size:21px}.pc-client{font-size:13px;line-height:1.4}.pc-goal{font-size:13px;padding:6px 12px}.pc-goal-row{margin-top:8px;gap:8px}.pc-world{max-height:190px}.pc{gap:10px}}
.pc-ledger>summary{font-weight:800;cursor:pointer;min-height:44px;display:flex;align-items:center}.pc-run-detail summary{cursor:pointer;min-height:44px;padding:8px 0;line-height:1.4}.pc-run-detail p{font-size:13px;line-height:1.5}.pc-prediction-feedback{font-size:13px;line-height:1.4;margin:0 0 8px}.pc-prediction-feedback:empty{display:none}.pc-prediction p,.pc-comparison p{font-size:14px;line-height:1.4;margin:8px 0}.pc-prediction-options{display:flex;gap:6px;flex-wrap:wrap}.pc-comparison label{display:block;font-size:13px;font-weight:700;margin:8px 0}.pc-comparison select{display:block;width:100%;max-width:100%;min-height:44px;background:var(--pc-card);color:var(--pc-ink);border:1px solid var(--pc-accent);border-radius:8px;font:inherit}.pc-setup{border-top:4px solid #2bb3a3}.pc-result{border-top:4px solid #f08a4b}.pc-think{border-top:4px solid #a78bfa}.pc-world{border:2px solid #a7e2da}.pc-prediction{border-radius:10px;background:var(--pc-chip);padding:4px 10px}.pc-main>*{min-width:0}
@media (prefers-reduced-motion:reduce){.pc *{transition:none!important}}
`;
