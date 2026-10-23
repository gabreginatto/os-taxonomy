import assert from 'node:assert/strict';
import { getModel, applyChecked, replay } from './models.mjs';
export function checkModels(keys, resolveModel = getModel) {
  const checks=[];
  const check=(name,fn)=>{try{fn();checks.push({name,status:'passed'});}catch(error){checks.push({name,status:'failed',error:error.message});}};
  for(const key of new Set(keys)) {
    const m=resolveModel(key);
    check(key+': initial invariants',()=>assert.equal(m.validateInvariants(m.initialState()),true));
    check(key+': serializable state',()=>assert.deepEqual(JSON.parse(JSON.stringify(m.initialState())),m.initialState()));
    if(key==='fractions') {
      check('fractions: fixed independent examples',()=>{
        for(const [n,d,expected] of [[1,2,true],[2,4,true],[3,6,true],[1,3,false],[0,4,false],[4,4,false]])assert.equal(m.assess({numerator:n,denominator:d}).correct,expected);
      });
      check('fractions: reject zero denominator',()=>assert.throws(()=>applyChecked(m,m.initialState(),{type:'denominator',value:0})));
    }
    if(key==='daynight')check('daynight: known orientations',()=>{assert.equal(m.observe({rotation:0}).period,'Day');assert.equal(m.observe({rotation:180}).period,'Night');assert.equal(m.observe({rotation:90}).period,'Day/night boundary');assert.equal(m.observe({rotation:360}).period,'Day');});
    if(key==='shapes')check('shapes: classification fixtures',()=>{for(const [shape,classification]of [['cube','solid'],['sphere','solid'],['circle','flat'],['square','flat']])assert.equal(m.observe({shape,rotation:0,answer:null}).classification,classification);});
    if(key==='water')check('water: condensation distinction',()=>{assert.equal(m.assess({stage:'condensation'}).correct,true);assert.equal(m.assess({stage:'evaporation'}).correct,false);});
    if(key==='moon')check('moon: known appearances',()=>{assert.equal(m.observe({phase:0}).illuminated,0);assert.equal(m.observe({phase:4}).illuminated,1);assert.equal(m.assess({phase:2}).correct,false);});
    if(key==='sentences')check('sentences: constrained fragment and complete sentence',()=>{assert.equal(m.observe({verb:false,detail:false}).sentence,'The dog');assert.equal(m.assess({verb:false,detail:true}).correct,false);assert.equal(m.observe({verb:true,detail:true}).sentence,'The dog ran quickly.');});
    check(key+': replay independent of seek history',()=>{const events=key==='fractions'?[{time:2,action:{type:'numerator',value:2}}]:[];const later=replay(m,events,4);replay(m,events,1);assert.deepEqual(replay(m,events,4),later);});
  }
  return checks;
}
