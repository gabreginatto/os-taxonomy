import test from 'node:test';
import assert from 'node:assert/strict';
import {plugin} from '../lessons/opportunity-cost/opportunity-cost.plugin.mjs';
import {applyChecked} from '../src/models.mjs';
import {checkExtensionModel} from '../src/extensions.mjs';
const act=(s,type,value)=>applyChecked(plugin,s,{type,value});
const sequence=actions=>actions.reduce((s,[type,value])=>act(s,type,value),plugin.initialState());

test('independent personal, affordability and counterfactual fixtures',()=>{
  for(const result of checkExtensionModel(plugin))assert.equal(result.status,'passed',JSON.stringify(result));
});
test('preview is not a committed choice; confirmation and next-best require different options',()=>{
  const initial=plugin.initialState(),preview=act(initial,'preview','robot');
  assert.equal(initial.candidate,null);assert.equal(preview.selected,null);
  assert.equal(plugin.observe(preview).phase,'confirm-choice');assert.equal(plugin.assess(preview).correct,false);
  const selected=act(preview,'commit');assert.equal(selected.selected,'robot');assert.equal(selected.candidate,null);
  assert.throws(()=>act(initial,'commit'));assert.throws(()=>act(selected,'alternative','robot'));
  assert.throws(()=>act(initial,'alternative','film'));assert.throws(()=>act(selected,'preview','park'));
});
test('all six stated personal preference pairs are valid, without objective favourite grading',()=>{
  for(const first of ['robot','film','park'])for(const second of ['robot','film','park'].filter(id=>id!==first)){
    const s=sequence([['preview',first],['commit'],['alternative',second]]),o=plugin.observe(s),a=plugin.assess(s);
    assert.deepEqual(o.bestAlternativeIds,[second]);assert.equal(a.correct,true);assert.equal(a.kind,'preference_elicitation');
    assert.match(a.message,/your preferences/);assert.equal(a.scope,'this_response_only');assert.equal(a.assessed,false);assert.equal(a.meaning,'valid_preference_pair');
    assert.ok(o.options.every(p=>p.feasible&&p.time===2&&p.cash===0));
  }
});
test('£10 movie is feasible BEFORE £8 robot purchase despite only £2 saved afterward',()=>{
  const base=sequence([['round','budget']]);
  assert.equal(base.selected,'robot');assert.equal(plugin.observe(base).leftCash,2);assert.equal(plugin.assess(base).assessed,true);assert.equal(plugin.assess(base).assistance,'help_not_requested');
  for(const [alternative,expected] of [['film',true],['garden',false],['observatory',false]]){
    const s=act(base,'alternative',alternative);assert.equal(plugin.assess(s).correct,expected);
    assert.deepEqual(plugin.observe(s).bestAlternativeIds,['film']);
  }
  assert.match(plugin.assess(act(base,'alternative','garden')).message,/rather make a movie/);
  assert.match(plugin.assess(act(base,'alternative','observatory')).message,/before choosing/);
});
test('£9 original-budget counterfactual changes only the budget and valid alternative',()=>{
  const ten=plugin.observe(sequence([['round','budget'],['alternative','film']]));
  const nineState=sequence([['round','tighter'],['alternative','garden']]),nine=plugin.observe(nineState);
  assert.equal(ten.selected,nine.selected);assert.equal(nine.leftCash,1);assert.equal(nine.cash,9);
  assert.deepEqual(nine.bestAlternativeIds,['garden']);assert.equal(plugin.assess(nineState).correct,true);
  assert.equal(plugin.assess(act(nineState,'alternative','film')).correct,false);
  assert.deepEqual(ten.options.map(({feasible,...o})=>o),nine.options.map(({feasible,...o})=>o));
});
test('back, restart, scene transitions and help preserve honest attempt state',()=>{
  const s=sequence([['preview','robot'],['commit'],['alternative','film'],['help']]);
  assert.equal(plugin.assess(s).assistance,'worked_example_used');
  const back=act(s,'back');assert.equal(back.selected,'robot');assert.equal(back.alternative,null);
  assert.equal(act(back,'back').selected,null);assert.equal(act(s,'restart').usedHelp,false);
  const next=act(s,'round','budget');assert.equal(next.alternative,null);assert.equal(next.usedHelp,false);
  for(const r of ['personal','budget','tighter']){
    const state=act(s,'round',r);assert.equal(plugin.validateInvariants(state),true);
    assert.deepEqual(JSON.parse(JSON.stringify(plugin.observe(state))),plugin.observe(state));
  }
});
test('unknown and corrupted states/actions are rejected',()=>{
  const s=plugin.initialState();
  for(const [type,value]of [['round','sunk'],['preview','missing'],['cash',12],['profile','analyst']])assert.throws(()=>act(s,type,value));
  assert.equal(plugin.validateInvariants({...s,selected:'robot',alternative:'robot'}),false);
  assert.equal(plugin.validateInvariants({...s,round:'budget'}),false);
  assert.equal(plugin.validateInvariants({...s,selected:'robot',candidate:'film'}),false);
});
