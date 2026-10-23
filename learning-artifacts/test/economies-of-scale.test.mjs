import test from 'node:test';
import assert from 'node:assert/strict';
import {plugin} from '../lessons/economies-of-scale/economies-of-scale.plugin.mjs';
import {applyChecked} from '../src/models.mjs';
import {checkExtensionModel} from '../src/extensions.mjs';

const act=(s,action)=>applyChecked(plugin,s,action);
const play=(actions,s=plugin.initialState())=>actions.reduce(act,s);
const set=(key,value)=>({type:'set',key,value}),run={type:'run'},reason=value=>({type:'reason',value}),next={type:'next'};
const w1=[set('orders',20),run,set('orders',30),run,reason('shared'),next];
const w2=[...w1,run,set('s2',2),run,reason('slowest'),next];
const predict=value=>({type:'predict',value}),compare=(key,value)=>({type:'compare',key,value});
const w3=[...w2,run,set('s1',5),set('s2',4),predict('lower'),run,set('s1',4),set('s2',3),predict('lower'),run,compare('baseline','0:2'),compare('larger','0:1'),reason('sync'),next];
const w4=[...w3,run,set('s1',2),set('s2',2),run,reason('idle'),next];
const w5=[...w4,run,set('s1',2),set('s2',3),predict('lower'),run,reason('carried'),next];
// Run one setup at the start of a week and read back the day (independent of the presentation).
const day=(prefix,dials)=>{let s=play(prefix);for(const [k,v] of Object.entries(dials))s=act(s,set(k,v));return plugin.observe(act(s,run));};
const pounds=o=>[o.cured,o.stuck,o.committed/100,o.total/100,Math.round(o.average)/100,o.profit/100];

test('metadata fixtures and initial serialization are valid',()=>{
  for(const c of checkExtensionModel(plugin))assert.equal(c.status,'passed',JSON.stringify(c));
  const s=plugin.initialState();assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});

test('week 1: total cost rises while cost per hoodie falls; only 30 hoodies is profitable',()=>{
  assert.deepEqual(pounds(day([],{orders:10})),[10,0,540,580,58,-340]);
  assert.deepEqual(pounds(day([],{orders:20})),[20,0,540,620,31,-140]);
  assert.deepEqual(pounds(day([],{orders:30})),[30,0,540,660,22,60]);
});

test('week 2: the second press without a second tunnel jams; 2 presses + 2 tunnels is the only profit',()=>{
  const prefix=w1;
  assert.deepEqual(pounds(day(prefix,{})),[40,20,660,900,22.5,-100]);
  assert.equal(day(prefix,{}).unfilled,20);
  assert.deepEqual(pounds(day(prefix,{s2:2})),[60,0,720,960,16,240]);
  assert.deepEqual(pounds(day(prefix,{s1:1,s2:1})),[30,0,540,660,22,-60]);
  assert.deepEqual(pounds(day(prefix,{s1:1,s2:2})),[30,0,600,720,24,-120]);
});

test('week 3: long-run cost per shirt is U-shaped and four presses + three tunnels is the unique best day',()=>{
  const prefix=w2,lrac=[[1,1],[2,2],[3,3],[4,3],[5,4],[6,5]].map(([s1,s2])=>Math.round(day(prefix,{s1,s2}).average)/100);
  assert.deepEqual(lrac,[22,16,14.67,14,14.4,15]);
  assert.deepEqual(pounds(day(prefix,{s1:4,s2:2})),[80,40,1140,1620,20.25,-420]);
  assert.deepEqual(pounds(day(prefix,{s1:5,s2:3})),[120,30,1500,2100,17.5,-300]);
  const profits=[];
  for(let s1=1;s1<=6;s1++)for(let s2=1;s2<=5;s2++)profits.push({s1,s2,profit:day(prefix,{s1,s2}).profit});
  const best=Math.max(...profits.map(p=>p.profit));
  assert.equal(best,12000);assert.deepEqual(profits.filter(p=>p.profit===best).map(p=>[p.s1,p.s2]),[[4,3]]);
});

test('week 4: the same leases sit idle at lower demand; only 2 presses + 2 tunnels makes a profit',()=>{
  const prefix=w3,trap=day(prefix,{});
  assert.deepEqual(pounds(trap),[60,0,1200,1440,24,-420]);assert.deepEqual([trap.result.idle1,trap.result.idle2],[2,1]);
  const winners=[];
  for(let s1=1;s1<=6;s1++)for(let s2=1;s2<=5;s2++)if(day(prefix,{s1,s2}).profit>0)winners.push([s1,s2]);
  assert.deepEqual(winners,[[2,2]]);
  assert.equal(day(prefix,{s1:2,s2:3}).profit,0);
});

test('week 5 transfer: benches can starve woks, woks can waste prepped bowls, and 3 woks + 2 benches is the only profit',()=>{
  const prefix=w4;
  const starve=day(prefix,{s2:3});assert.deepEqual([starve.cured,starve.stuck,starve.total,starve.profit],[80,0,63200,-15200]);assert.ok(starve.result.idle2>0);
  const waste=day(prefix,{s1:2,s2:2});assert.deepEqual([waste.cured,waste.stuck,waste.total,waste.profit],[100,50,74500,-14500]);
  assert.deepEqual([day(prefix,{s1:2,s2:4}).total,day(prefix,{s1:3,s2:3}).total],[101000,92000]);
  const winners=[];
  for(let s1=1;s1<=3;s1++)for(let s2=1;s2<=4;s2++){const o=day(prefix,{s1,s2});if(o.profit>0)winners.push([s1,s2,o.total,o.profit]);}
  assert.deepEqual(winners,[[2,3,86000,4000]]);
});

test('assessment judges the run setup, the target, the seen-it condition and one reason — in that order',()=>{
  const msg=s=>plugin.assess(s).message;
  assert.match(msg(plugin.initialState()),/Nothing has run yet/);
  assert.match(msg(play([set('orders',30),run,set('orders',20)])),/changed the setup/);
  assert.match(msg(play([run])),/lost £340/);
  assert.match(msg(play([set('orders',30),run])),/run a different number/);
  assert.match(msg(play([run,set('orders',30),run])),/answer the question/);
  const wrong=plugin.assess(play([run,set('orders',30),run,reason('total')]));assert.equal(wrong.correct,false);assert.match(wrong.message,/total went up/);
  const right=plugin.assess(play(w1.slice(0,-1)));assert.equal(right.correct,true);assert.equal(right.scope,'this_response_only');assert.equal(right.mastery_claim,false);
  const profitableNotBest=plugin.assess(play([...w2,run,set('s1',2),set('s2',2),predict('lower'),run,set('s1',5),set('s2',4),predict('lower'),run,reason('sync')]));
  assert.equal(profitableNotBest.correct,false);assert.match(profitableNotBest.message,/most profitable size/);
  assert.doesNotMatch(profitableNotBest.message,/4 presses|four presses/);
});

test('reasons stay locked until the week’s evidence has been seen',()=>{
  assert.throws(()=>play([reason('shared')]));
  assert.throws(()=>play([set('orders',30),run,reason('shared')]));
  assert.throws(()=>play([...w1,set('s2',2),run,reason('slowest')]),'week 2 requires a day with stuck tees');
  assert.throws(()=>play([...w3,set('s1',2),set('s2',2),run,reason('idle')]),'week 4 requires a day with idle capacity');
  assert.doesNotThrow(()=>play([...w1,run,reason('slowest')]));
});

test('six days per week; restarting keeps earlier days on the ledger, faded',()=>{
  let s=play([run,run,run,run,run,run]);
  assert.equal(plugin.observe(s).weekOver,true);assert.throws(()=>act(s,run));
  s=act(s,{type:'retry'});const o=plugin.observe(s);
  assert.deepEqual([o.attempt,o.day,o.weekOver,o.ledger.length,o.ledger.filter(p=>p.current).length],[1,0,false,6,0]);
  assert.equal('cash' in o,false);
  s=play([set('orders',30),run],s);assert.equal(plugin.observe(s).gateOpen,true,'earlier attempts count as evidence');
});

test('setups are limited to what each week offers and progression requires a correct check',()=>{
  assert.throws(()=>play([set('orders',25)]));assert.throws(()=>play([set('s1',2)]));assert.throws(()=>play([next]));
  const week2=play(w1);
  assert.throws(()=>act(week2,set('s1',3)));assert.throws(()=>act(week2,set('orders',30)));assert.throws(()=>act(week2,set('s2',0)));
  for(const v of [1.5,NaN,'2'])assert.throws(()=>act(play(w2),set('s1',v)));
  assert.throws(()=>act(week2,{type:'mystery'}));
});

test('five weeks complete the game; restart returns to the start',()=>{
  const done=play(w5),o=plugin.observe(done);
  assert.equal(done.complete,true);assert.equal(o.history.length,5);
  assert.deepEqual(o.history.map(h=>[h.average,h.profit]),[[2200,6000],[1600,24000],[1400,12000],[1600,6000],[86000/150,4000]]);
  assert.equal(plugin.assess(done).correct,true);assert.throws(()=>act(done,run));
  assert.deepEqual(act(done,{type:'restart'}),plugin.initialState());
});

test('state is immutable, serializable and checked by invariants',()=>{
  const s=play([run,set('orders',30)]),copy=structuredClone(s);act(s,run);assert.deepEqual(s,copy);
  for(const prefix of [[],w1,w2,w3,w4,w5])assert.deepEqual(JSON.parse(JSON.stringify(plugin.observe(play(prefix)))),plugin.observe(play(prefix)));
  const base=play([run]);
  assert.equal(plugin.validateInvariants({...base,dials:{orders:10,s1:2,s2:1}}),false);
  assert.equal(plugin.validateInvariants({...base,runs:[{...base.runs[0],day:3}]}),false);
  assert.equal(plugin.validateInvariants({...base,reason:'shared'}),false,'reason cannot precede its evidence');
  assert.equal(plugin.validateInvariants({...base,history:[{level:'rent',dials:{orders:10,s1:1,s2:1},reason:'shared'}],level:1}),false,'history must hold a winning setup');
  assert.equal(plugin.assess(act(play(w1.slice(0,-1)),{type:'help'})).assistance,'help_requested');
});


test('week 3 cannot pass decreasing-only evidence or use a jam or surplus tunnel as the upswing',()=>{
  const decreasing=play([...w2,run,set('s1',2),set('s2',2),predict('lower'),run,set('s1',4),set('s2',3),predict('lower'),run]);
  assert.equal(plugin.observe(decreasing).gateOpen,false);
  assert.throws(()=>act(decreasing,reason('sync')));
  assert.equal(plugin.assess(decreasing).correct,false);
  let s=play([set('s1',5),set('s2',3),predict('higher'),run],decreasing);
  assert.equal(plugin.observe(s).ledger.at(-1).classification,'bottleneck');
  assert.equal(plugin.observe(s).gateOpen,false);
  s=play([set('s1',4),set('s2',4),predict('lower'),run],s);
  assert.equal(plugin.observe(s).ledger.at(-1).classification,'idle');
  assert.equal(plugin.observe(s).gateOpen,false);
});

test('the scale answer requires learner-selected actual comparison runs',()=>{
  let s=play(w3.slice(0,-4));
  assert.equal(plugin.observe(s).gateOpen,true);
  s=act(s,reason('sync'));
  assert.equal(plugin.assess(s).correct,false);
  s=play([compare('baseline','0:0'),compare('larger','0:1')],s);
  assert.equal(plugin.assess(s).correct,false);
  s=act(s,compare('baseline','0:2'));
  assert.equal(plugin.observe(s).comparisonValid,true);
  assert.equal(plugin.assess(s).correct,true);
  assert.throws(()=>act(s,compare('larger','99:99')));
});

test('predictions precede changed scale and transfer runs, retain mistakes, and permit learning',()=>{
  let s=play([...w2,run,set('s1',5),set('s2',4)]);
  assert.equal(plugin.observe(s).predictionRequired,true);
  assert.throws(()=>act(s,run));
  assert.equal(plugin.observe(s).day,1);
  s=play([predict('higher'),run],s);
  const feedback=plugin.observe(s).predictionFeedback;
  assert.deepEqual([feedback.value,feedback.actual,feedback.correct],['higher','lower',false]);
  assert.equal(plugin.observe(s).ledger.at(-1).prediction.correct,false);
  s=play([set('s1',4),set('s2',3),predict('lower'),run,compare('baseline','0:2'),compare('larger','0:1'),reason('sync')],s);
  assert.equal(plugin.assess(s).correct,true,'a wrong prediction is feedback, not permanent lockout');
  let transfer=play([...w4,run,set('s1',2),set('s2',3)]);
  assert.throws(()=>act(transfer,run));
  transfer=play([predict('higher'),run,reason('carried')],transfer);
  assert.equal(plugin.observe(transfer).predictionFeedback.correct,false);
  assert.equal(plugin.assess(transfer).correct,true);
});

test('reason order is deterministic, varied, and includes every option once',()=>{
  const indices=[[],w1,w2,w3,w4].map(prefix=>{const a=plugin.observe(play(prefix)),b=plugin.observe(play(prefix));assert.deepEqual(a.reasons,b.reasons);assert.equal(new Set(a.reasons.map(([id])=>id)).size,3);return a.reasons.findIndex(([id])=>id===['shared','slowest','sync','idle','carried'][a.level]);});
  assert.ok(new Set(indices).size>1);
});

test('stored prediction evidence rejects tampering and setup changes clear pending predictions',()=>{
  let s=play([...w2,run,set('s1',5),set('s2',4),predict('higher')]);
  s=act(s,set('s1',6));
  assert.equal(plugin.observe(s).prediction,null);
  assert.throws(()=>act(s,run));
  s=play([set('s1',5),predict('higher'),run],s);
  for(const patch of [{correct:true},{referenceId:'9:9'},{actual:'higher'},{average:0},{referenceAverage:0}]){
    const forged=structuredClone(s),last=forged.runs.at(-1);last.prediction={...last.prediction,...patch};
    assert.equal(plugin.validateInvariants(forged),false,JSON.stringify(patch));
  }
  const missing=structuredClone(s);missing.runs.at(-1).prediction=null;
  assert.equal(plugin.validateInvariants(missing),false);
});

test('ledger distinguishes fractional utilization, whole idle stations, and efficient scale',()=>{
  assert.equal(plugin.observe(play([run])).ledger[0].classification,'underused');
  assert.equal(plugin.observe(play([set('orders',30),run])).ledger[0].classification,'efficient');
  const size=play([...w2,run,set('s1',4),set('s2',4),predict('lower'),run]);
  assert.deepEqual(plugin.observe(size).ledger.map(r=>r.classification),['efficient','idle']);
});


test('week 3 requires the observed falling side as well as the rising side',()=>{
  let s=play([...w2,set('s1',4),set('s2',3),run,set('s1',5),set('s2',4),predict('higher'),run,set('s1',6),set('s2',5),predict('higher'),run]);
  assert.equal(plugin.observe(s).gateOpen,false);
  assert.throws(()=>act(s,reason('sync')));
  s=play([compare('baseline','0:0'),compare('larger','0:1')],s);
  assert.equal(plugin.observe(s).comparisonValid,true,'a rising pair alone does not supply the falling-side observation');
  assert.equal(plugin.assess(s).correct,false);
  s=play([set('s1',4),set('s2',3),predict('lower'),run],s);
  assert.equal(plugin.observe(s).gateOpen,false,'returning to the best setup supplies no smaller comparison');
  s=play([set('s1',2),set('s2',3),predict('higher'),run],s);
  assert.equal(plugin.observe(s).ledger.at(-1).classification,'idle');
  assert.equal(plugin.observe(s).gateOpen,false,'a smaller setup with surplus whole tunnels cannot substitute');
  s=play([set('s1',1),set('s2',1),predict('higher'),run],s);
  assert.equal(plugin.observe(s).gateOpen,true,'an actually observed smaller balanced setup supplies the falling side');
});
