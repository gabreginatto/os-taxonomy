import test from 'node:test';
import assert from 'node:assert/strict';
import {plugin} from '../lessons/economies-of-scale/economies-of-scale.plugin.mjs';
import {applyChecked} from '../src/models.mjs';
import {checkExtensionModel} from '../src/extensions.mjs';
const act=(s,type,value)=>applyChecked(plugin,s,{type,value});
const ready=s=>{assert.equal(plugin.assess(s).correct,true);return act(s,'next');};
const share=()=>act(act(plugin.initialState(),'batch',20),'answer','spread');
const bottleneck=()=>act(act(ready(share()),'upgrade','packing'),'answer','packing');
const grow=()=>act(act(ready(bottleneck()),'teams',4),'answer','coordination');
const quiet=()=>act(act(ready(grow()),'teams',1),'answer','demand');
const transfer=()=>act(ready(quiet()),'answer','profit');

test('scale metadata fixtures and initial serialization are valid',()=>{
 for(const c of checkExtensionModel(plugin))assert.equal(c.status,'passed',JSON.stringify(c));
});
test('using the existing workshop more fully lowers average cost while total cost rises',()=>{
 const a=plugin.observe(plugin.initialState()),b=plugin.observe(share());
 assert.deepEqual([a.produced,a.total,a.average],[10,14000,1400]);
 assert.deepEqual([b.produced,b.total,b.average],[20,18000,900]);
 assert.equal(a.fixed,b.fixed);assert.equal(a.variableRate,b.variableRate);assert.ok(b.total>a.total);assert.ok(b.average<a.average);
 assert.equal(plugin.assess(act(share(),'answer','materials')).correct,false);
 assert.equal(plugin.assess(act(share(),'answer','total')).correct,false);
});
test('upgrading the nonlimiting stage adds cost without more finished output',()=>{
 const s=ready(share()),baseline=plugin.observe(s),assembly=plugin.observe(act(s,'upgrade','assembly')),packing=plugin.observe(act(s,'upgrade','packing'));
 assert.deepEqual([baseline.assembly,baseline.packing,baseline.produced,baseline.total],[80,40,40,36000]);
 assert.deepEqual([assembly.assembly,assembly.packing,assembly.produced,assembly.total,assembly.average],[160,40,40,46000,1150]);
 assert.deepEqual([packing.assembly,packing.packing,packing.produced,packing.total,packing.average],[80,80,80,52000,650]);
 assert.equal(plugin.assess(act(act(s,'upgrade','assembly'),'answer','packing')).correct,false);
});
test('all six expansion plans preserve demand, money and capacity; cheapest sufficient is four',()=>{
 const s=ready(bottleneck()),expectedTotals=[18000,30000,45000,63000,76000,92000],expectedOutput=[20,40,60,80,80,80];
 for(let n=1;n<=6;n++){
  const o=plugin.observe(act(s,'teams',n));assert.equal(o.total,expectedTotals[n-1]);assert.equal(o.produced,expectedOutput[n-1]);
  assert.equal(o.produced+o.unfilled,80);assert.equal(o.capacity,o.produced+o.idle);assert.equal(o.total,o.fixed+o.coordination+o.variable);
  assert.equal(plugin.assess(act(act(s,'teams',n),'answer','coordination')).correct,n===4);
 }
 const curve=plugin.observe(s).curve;
 assert.deepEqual(curve.map(p=>p.fullAverage),[900,750,750,787.5,840,900]);
 assert.equal(plugin.observe(grow()).average,787.5);assert.equal(plugin.observe(act(s,'teams',2)).average,750);assert.equal(plugin.observe(act(s,'teams',2)).unfilled,40);
});
test('a demand fall changes the cheapest sufficient plan without refunding past costs',()=>{
 const s=ready(grow()),before=plugin.observe(s),after=plugin.observe(act(s,'teams',1));
 assert.deepEqual([before.requested,before.teams,before.produced,before.idle,before.total,before.average],[20,4,20,60,39000,1950]);
 assert.deepEqual([after.produced,after.total,after.average],[20,18000,900]);assert.equal(after.variableRate,before.variableRate);
 for(let n=2;n<=6;n++)assert.ok(plugin.observe(act(s,'teams',n)).total>18000);
});
test('food-stall transfer compares full cost and profit rather than cheap ingredients alone',()=>{
 const s=ready(quiet()),small=plugin.observe(s),big=plugin.observe(act(s,'plan','big'));
 assert.deepEqual([small.revenue,small.total,small.profit,small.average],[60000,24000,36000,600]);
 assert.deepEqual([big.revenue,big.total,big.profit,big.average],[60000,56000,4000,1400]);
 assert.ok(big.variableRate<small.variableRate);assert.equal(plugin.assess(act(s,'answer','profit')).correct,true);
 for(const a of ['bigger','rent'])assert.equal(plugin.assess(act(s,'answer',a)).correct,false);
});
test('progression requires the current configuration and reasoning; changes clear stale answers',()=>{
 assert.throws(()=>act(plugin.initialState(),'next'));assert.equal(act(share(),'batch',10).answer,null);
 assert.equal(plugin.assess(act(share(),'batch',10)).correct,false);assert.throws(()=>act(plugin.initialState(),'batch',0));
 const s=ready(bottleneck());for(const n of [0,7,1.5,NaN])assert.throws(()=>act(s,'teams',n));
 assert.throws(()=>act(s,'upgrade','packing'));assert.throws(()=>act(s,'answer','spread'));
 const complete=ready(transfer());assert.equal(complete.complete,true);assert.equal(complete.history.length,5);assert.equal(plugin.assess(complete).scope,'this_response_only');assert.equal(plugin.assess(complete).mastery_claim,false);
 assert.throws(()=>act(complete,'plan','big'));assert.deepEqual(act(complete,'restart'),plugin.initialState());
});
test('recorded help is bounded to the current experiment and state is immutable/serializable',()=>{
 const s=share(),copy=structuredClone(s),help=act(s,'help');assert.deepEqual(s,copy);assert.equal(plugin.assess(help).assistance,'help_requested');
 const next=ready(help);assert.equal(next.history[0].help,true);assert.equal(next.help,false);
 for(const state of [s,bottleneck(),grow(),quiet(),transfer(),ready(transfer())])assert.deepEqual(JSON.parse(JSON.stringify(plugin.observe(state))),plugin.observe(state));
 assert.equal(plugin.validateInvariants({...s,history:[{phase:'transfer'}]}),false);assert.equal(plugin.validateInvariants({...s,teams:9}),false);
});
