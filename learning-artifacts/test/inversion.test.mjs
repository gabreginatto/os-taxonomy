import test from 'node:test';
import assert from 'node:assert/strict';
import {plugin} from '../lessons/inversion/inversion.plugin.mjs';
import {applyChecked,replay} from '../src/models.mjs';
import {checkExtensionModel} from '../src/extensions.mjs';
const act=(s,type,value)=>applyChecked(plugin,s,{type,value});
const run=actions=>actions.reduce((s,a)=>applyChecked(plugin,s,a),plugin.initialState());
const inspect=(s,part,prediction,repair)=>[['inspect',part],['commitInspect'],['predict',prediction],['confirmPrediction'],['repair',repair],['rehearse']].reduce((v,[t,x])=>act(v,t,x),s);
const learn=()=>inspect(act(act(plugin.initialState(),'baseline'),'continue'),'hatch','spill','seal');
const challenge=()=>act(act(learn(),'reveal'),'nextMission');
const win=()=>inspect(act(inspect(act(challenge(),'continue'),'hatch','spill','seal'),'continue'),'beacon','wrong-moon','wake');
test('independent fixed outcomes and full authored-response sequence',()=>{for(const c of checkExtensionModel(plugin))assert.equal(c.status,'passed',JSON.stringify(c));});
test('the actual timed scenario includes explicit phase confirmations and replays deterministically',()=>{
  const first=replay(plugin,plugin.scenario,4);replay(plugin,plugin.scenario,1);const second=replay(plugin,plugin.scenario,4);
  assert.deepEqual(first,second);assert.equal(plugin.observe(first).goalMet,true);assert.equal(first.phase,'result');
});
test('all 32 configurations obey independent delivery, spill and destination rules',()=>{
  for(const hatchOpen of [false,true])for(const beaconOn of [false,true])for(const seedsLoaded of [false,true])for(const badgePolished of [false,true])for(const beaconClean of [false,true]){
    const s={...plugin.initialState(),hatchOpen,beaconOn,seedsLoaded,badgePolished,beaconClean},o=plugin.observe(s);
    assert.equal(plugin.validateInvariants(s),true);assert.equal(o.currentOutcome.delivered,seedsLoaded&&!hatchOpen&&beaconOn?3:0);
    assert.equal(o.currentOutcome.spilled,seedsLoaded&&hatchOpen);assert.equal(o.currentOutcome.empty,!seedsLoaded);assert.equal(o.currentOutcome.wrongMoon,!beaconOn);
  }
});
test('prediction concerns the component before repair and wrong guesses do not block experimentation',()=>{
  for(const prediction of ['spill','wrong-moon']){
    const s=inspect(act(act(plugin.initialState(),'baseline'),'continue'),'hatch',prediction,'seal'),p=s.history.at(-1).prediction;
    assert.equal(plugin.observe(s).goalMet,true);assert.equal(p.beforeCause,'spill');assert.equal(p.matched,prediction==='spill');
    assert.equal(plugin.observe(s).lastFlight.spilled,false);assert.equal(plugin.assess(s).correct,false);
  }
});
test('empty rocket prevents a spill but fails the positive goal; undo restores an easy recovery',()=>{
  const s=inspect(act(act(plugin.initialState(),'baseline'),'continue'),'hatch','spill','unload'),o=plugin.observe(s);
  assert.equal(o.lastFlight.spilled,false);assert.equal(o.lastFlight.delivered,0);assert.equal(o.goalMet,false);assert.match(plugin.assess(s).message,/goal was to deliver/);
  const undone=act(s,'undo');assert.equal(undone.seedsLoaded,true);assert.equal(undone.phase,'inspect');assert.equal(undone.prediction,null);
  assert.equal(plugin.observe(inspect(undone,'hatch','spill','seal')).goalMet,true);
});
test('independent failure paths remain after one repair, and repair order does not determine success',()=>{
  for(const first of ['hatch','beacon']){
    const second=first==='hatch'?'beacon':'hatch',answer={hatch:'spill',beacon:'wrong-moon'},fix={hatch:'seal',beacon:'wake'};
    const one=inspect(act(challenge(),'continue'),first,answer[first],fix[first]);assert.equal(plugin.observe(one).knownFailureCount,1);assert.equal(plugin.observe(one).goalMet,false);
    const two=inspect(act(one,'continue'),second,answer[second],fix[second]);assert.equal(plugin.observe(two).goalMet,true);assert.equal(two.history.length,3);
  }
});
test('cosmetic work has no effect on either delivery path; each intervention changes only one configuration field',()=>{
  const badge=inspect(act(act(plugin.initialState(),'baseline'),'continue'),'badge','none','polish');assert.equal(badge.hatchOpen,true);assert.equal(plugin.observe(badge).goalMet,false);
  const casing=inspect(act(challenge(),'continue'),'beacon','wrong-moon','clean');assert.equal(casing.beaconOn,false);assert.equal(casing.beaconClean,true);assert.equal(plugin.observe(casing).knownFailureCount,2);
  for(const s of [badge,casing,learn(),win()]){const r=s.history.at(-1);assert.equal(Object.keys(r.config).filter(k=>r.config[k]!==r.before[k]).length,1);}
});
test('a successful flight does not guarantee completion without the bounded conclusion; prediction records remain intact',()=>{
  const s=act(win(),'conclude');assert.equal(plugin.assess(s).correct,false);
  const wrong=act(act(s,'conclusion','guarantee'),'submitConclusion');assert.equal(wrong.phase,'conclusion');assert.equal(plugin.assess(wrong).correct,false);
  const right=act(act(wrong,'conclusion','limits'),'submitConclusion');assert.equal(right.phase,'complete');assert.equal(plugin.assess(right).correct,true);assert.equal(plugin.assess(right).scope,'this_response_only');assert.deepEqual(right.history,s.history);
});
test('phase guards, resets, serializability and evidence integrity are enforced',()=>{
  const s=plugin.initialState();for(const [type,value]of[['rehearse'],['nextMission'],['submitConclusion'],['inspect','hatch'],['repair','seal']])assert.throws(()=>act(s,type,value));
  const before=learn(),next=challenge();assert.equal(next.hatchOpen,true);assert.equal(next.beaconOn,false);assert.equal(next.history.length,1);assert.equal(next.prediction,null);
  assert.equal(act(next,'restart').history.length,1);assert.deepEqual(JSON.parse(JSON.stringify(before)),before);
  const forged=structuredClone(before);forged.history.at(-1).prediction.matched=false;assert.equal(plugin.validateInvariants(forged),false);
  const empty=structuredClone(win());empty.seedsLoaded=false;assert.equal(plugin.validateInvariants(empty),false);
});
