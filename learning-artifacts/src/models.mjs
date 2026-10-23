const integer = (value, min, max, label) => {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error('Invalid ' + label);
  return value;
};
const result = (correct, message) => ({ correct, message, scope: 'this_response_only' });
export const phases = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
export const cycleTerms = ['evaporation', 'condensation', 'precipitation', 'collection'];
export const cycleDescriptions = {
  evaporation: 'Liquid water changes into invisible water vapour at the surface. It can happen without boiling.',
  condensation: 'Water vapour cools and becomes liquid droplets. Clouds contain tiny droplets or ice crystals.',
  precipitation: 'Water falls from clouds as rain, snow, sleet, or hail.',
  collection: 'Water gathers in places such as rivers, lakes, and oceans. Some also soaks into the ground.'
};
const definitions = {
  fractions: {
    initialState: () => ({ numerator: 1, denominator: 4 }),
    applyAction(s, a) {
      if (a.type === 'numerator') return { ...s, numerator: integer(a.value, 0, s.denominator, 'numerator') };
      if (a.type === 'denominator') { const d = integer(a.value, 1, 12, 'denominator'); return { numerator: Math.min(s.numerator, d), denominator: d }; }
      throw new Error('Unknown fraction action');
    },
    observe: s => ({ ...s, proportion: s.numerator / s.denominator, equivalent: s.numerator * 2 === s.denominator, label: s.numerator + '/' + s.denominator }),
    validateInvariants: s => Number.isInteger(s.numerator) && Number.isInteger(s.denominator) && s.denominator > 0 && s.denominator <= 12 && s.numerator >= 0 && s.numerator <= s.denominator,
    assess: s => result(s.numerator * 2 === s.denominator, s.numerator * 2 === s.denominator ? 'You matched one half! The shaded areas are equal.' : 'Compare the shaded areas. Can you show the same amount as one half?')
  },
  shapes: {
    initialState: () => ({ shape: 'cube', rotation: 0, answer: null }),
    applyAction(s, a) {
      if (a.type === 'shape' && ['cube', 'sphere', 'circle', 'square'].includes(a.value)) return { ...s, shape: a.value, answer: null };
      if (a.type === 'rotation') return { ...s, rotation: integer(a.value, 0, 360, 'rotation') };
      if (a.type === 'answer' && ['flat', 'solid'].includes(a.value)) return { ...s, answer: a.value };
      throw new Error('Unknown shape action');
    },
    observe: s => ({ ...s, classification: ['cube', 'sphere'].includes(s.shape) ? 'solid' : 'flat', label: s.shape }),
    validateInvariants: s => ['cube', 'sphere', 'circle', 'square'].includes(s.shape) && Number.isFinite(s.rotation) && s.rotation >= 0 && s.rotation <= 360,
    assess(s) { const expected = ['cube', 'sphere'].includes(s.shape) ? 'solid' : 'flat'; return result(s.answer === expected, s.answer === expected ? 'Yes! This ' + s.shape + ' is ' + expected + '.' : 'Look at its depth. Is it a flat shape or a solid object?'); }
  },
  water: {
    initialState: () => ({ stage: 'collection' }),
    applyAction(s, a) { if (a.type !== 'stage' || !cycleTerms.includes(a.value)) throw new Error('Unknown water-cycle action'); return { stage: a.value }; },
    observe: s => ({ ...s, description: cycleDescriptions[s.stage], label: s.stage }),
    validateInvariants: s => cycleTerms.includes(s.stage),
    assess: s => result(s.stage === 'condensation', s.stage === 'condensation' ? 'Yes! Condensation turns water vapour into liquid droplets.' : 'Find the stage where water vapour changes into liquid droplets.')
  },
  moon: {
    initialState: () => ({ phase: 0 }),
    applyAction(s, a) { if (a.type !== 'phase') throw new Error('Unknown Moon action'); return { phase: integer(a.value, 0, 7, 'phase') }; },
    observe: s => ({ ...s, label: phases[s.phase], illuminated: [0, .25, .5, .75, 1, .75, .5, .25][s.phase] }),
    validateInvariants: s => Number.isInteger(s.phase) && s.phase >= 0 && s.phase < 8,
    assess: s => result(s.phase === 4, s.phase === 4 ? 'You found the full moon: it appears as a bright circle.' : 'Move through the cycle to find a full moon.')
  },
  daynight: {
    initialState: () => ({ rotation: 0 }),
    applyAction(s, a) { if (a.type !== 'rotation') throw new Error('Unknown Earth action'); return { rotation: integer(a.value, 0, 360, 'rotation') }; },
    observe(s) { const facing = Math.cos(s.rotation * Math.PI / 180); return { ...s, facing, period: Math.abs(facing) < .001 ? 'Day/night boundary' : facing > 0 ? 'Day' : 'Night', label: Math.abs(facing) < .001 ? 'Day/night boundary' : facing > 0 ? 'Day' : 'Night' }; },
    validateInvariants: s => Number.isInteger(s.rotation) && s.rotation >= 0 && s.rotation <= 360,
    assess(s) { const night = Math.cos(s.rotation * Math.PI / 180) < -.001; return result(night, night ? 'Yes! The observer faces away from sunlight: it is night there.' : 'Turn Earth until the observer faces away from sunlight.'); }
  },
  sentences: {
    initialState: () => ({ verb: false, detail: false }),
    applyAction(s, a) { if (!['verb', 'detail'].includes(a.type) || typeof a.value !== 'boolean') throw new Error('Unknown sentence action'); return { ...s, [a.type]: a.value }; },
    observe: s => ({ ...s, complete: s.verb, sentence: 'The dog' + (s.verb ? ' ran' : '') + (s.detail ? ' quickly' : '') + (s.verb ? '.' : ''), label: s.verb ? 'Complete sentence' : 'Sentence fragment' }),
    validateInvariants: s => typeof s.verb === 'boolean' && typeof s.detail === 'boolean',
    assess: s => result(s.verb, s.verb ? 'Now it tells us what the dog did. You made a complete sentence!' : 'The dog… did what? Add an action to finish the thought.')
  }
};
export const modelKeys = Object.keys(definitions);
export function getModel(key) {
  const model = definitions[key];
  if (!model) throw new Error('Unknown model ' + key);
  return model;
}
export function applyChecked(model, state, action) {
  const next = model.applyAction(structuredClone(state), action);
  if (!model.validateInvariants(next)) throw new Error('Domain invariant failed');
  return next;
}
export function replay(model, events, time) {
  let state = model.initialState();
  for (const event of events) if (event.time <= time) state = applyChecked(model, state, event.action);
  return state;
}
