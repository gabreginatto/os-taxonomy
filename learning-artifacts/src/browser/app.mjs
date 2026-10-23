import { gsap } from 'gsap';
import { getModel, replay, applyChecked, phases, cycleTerms } from '../models.mjs';
import { renderSvg } from './scenes.mjs';
import './style.css';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function boot(manifest, externalPlugin = null) {
  const app = document.getElementById('app');
  app.innerHTML = '<header class="topbar"><div class="brand"><span></span>MARBLE · DISCOVERY LAB</div><div class="pill">Predict · Explore · Explain</div></header><nav class="lesson-nav" aria-label="Lessons"></nav><div class="eyebrow" id="eyebrow"></div><h1 id="title"></h1><p class="lede" id="prompt"></p><main class="layout"><section class="stage-wrap" aria-label="Explore the concept"><div id="stage" class="stage"></div><div class="stage-note" id="stage-note"></div></section><section class="panel" aria-label="Learning controls"><h2>Your experiment</h2><div id="controls"></div><div id="readout" class="readout" aria-live="polite"></div><div class="buttons"><button id="check" class="primary">Check my idea</button><button id="reset">Start again</button></div><div id="feedback" class="feedback" role="status"></div></section></main><details class="explain"><summary>Explain it · Learning goals & model notes</summary><div id="explanation"></div></details><footer class="footer"><span>Marble Skill Taxonomy · Generative Spark, Inc. · Content CC BY-SA 4.0 · Database ODbL 1.0</span><span>Explore at your own pace</span></footer>';
  let current = 0, state, model, lesson, stage, presentation = null, presentationReady = false, lastAssessment = null;
  let switchToken = 0;
  const $ = id => document.getElementById(id);
  const readout = () => model.observe(state);
  const isVideo = document.body.classList.contains('video') || new URLSearchParams(location.search).has('video');
  if(isVideo) document.body.classList.add('video');
  if(isVideo){document.querySelector('.panel h2').textContent='Watch the idea';$('feedback').textContent='A scripted demonstration. Try the interactive lesson to explore for yourself.';}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function selectMarkup(type, label, values, selected) {
    return '<label class="field">' + label + '<select data-action="' + type + '" aria-label="' + label + '">' + values.map(v => '<option value="' + escapeHtml(v) + '"' + (String(v) === String(selected) ? ' selected' : '') + '>' + escapeHtml(v) + '</option>').join('') + '</select></label>';
  }
  function rangeMarkup(type,label,value,max,step=1) {
    return '<label class="field">' + label + '<input aria-label="' + label + '" data-action="' + type + '" type="range" min="0" max="' + max + '" step="' + step + '" value="' + value + '"></label>';
  }
  function controls() {
    if (externalPlugin?.createPresentation) return;
    if(lesson.plugin_id === 'fractions') $('controls').innerHTML = selectMarkup('denominator','Equal parts',[2,3,4,6,8],state.denominator) + rangeMarkup('numerator','Shaded parts',state.numerator,state.denominator);
    if(lesson.plugin_id === 'shapes') $('controls').innerHTML = selectMarkup('shape','Choose a shape',['cube','sphere','circle','square'],state.shape) + rangeMarkup('rotation','Turn the shape',state.rotation,360,15) + '<div class="buttons"><button data-action="answer" data-value="flat" aria-pressed="' + (state.answer === 'flat') + '">Flat</button><button data-action="answer" data-value="solid" aria-pressed="' + (state.answer === 'solid') + '">Solid</button></div>';
    if(lesson.plugin_id === 'water') $('controls').innerHTML = selectMarkup('stage','Water-cycle stage',cycleTerms,state.stage);
    if(lesson.plugin_id === 'moon') $('controls').innerHTML = rangeMarkup('phase','Move through the Moon cycle',state.phase,7) + '<p>A repeating pattern over about a month.</p>';
    if(lesson.plugin_id === 'daynight') $('controls').innerHTML = rangeMarkup('rotation','Turn Earth',state.rotation,360,15) + '<p>The golden dot is our observer. Sunlight comes from the golden Sun.</p>';
    if(lesson.plugin_id === 'sentences') $('controls').innerHTML = '<div class="buttons"><button data-action="verb" data-value="' + !state.verb + '" aria-pressed="' + state.verb + '">Add / remove “ran”</button><button data-action="detail" data-value="' + !state.detail + '" aria-pressed="' + state.detail + '">Add / remove “quickly”</button></div>';
  }
  function render(presentationTime = 0, renderOptions = {}) {
    const o = readout();
    if (presentation) presentation.render(o, presentationTime, renderOptions);
    else renderSvg(stage, lesson.plugin_id, o);
    $('readout').textContent = lesson.plugin_id === 'fractions' ? o.label + ' · compare with 1/2' : lesson.plugin_id === 'sentences' ? o.sentence : o.label;
    $('stage-note').textContent = lesson.plugin_id === 'water' ? o.description : lesson.plugin_id === 'daynight' ? 'Observer: ' + o.period + ' · Sizes and distances are not to scale.' : lesson.plugin_id === 'shapes' ? (o.classification === 'flat' ? 'An ideal flat shape has no depth.' : 'Turn it to inspect its depth.') : lesson.plugin_id === 'moon' ? 'A diagram of the Moon’s appearance, not its physical shape.' : lesson.plugin_id === 'fractions' ? 'Both bars represent the same-sized whole.' : o.label;
    if(lesson.plugin_id === 'shapes' && presentation) {
      stage.style.visibility = o.classification === 'flat' ? 'hidden' : 'visible';
      let flat = document.getElementById('flat-overlay');
      if(o.classification === 'flat') {
        if(!flat){flat=document.createElement('div');flat.id='flat-overlay';flat.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center';stage.parentElement.append(flat);}
        renderSvg(flat,'shapes',o);
      } else flat?.remove();
    }
  }
  function dispatch(action) {
    state = applyChecked(model,state,action); lastAssessment = null;
    $('feedback').textContent = ''; $('feedback').removeAttribute('data-correct');
    render();
    // Keep focus stable while a range input moves.
    if(action.type === 'denominator' || action.type === 'shape' || ['verb','detail','answer'].includes(action.type)) {
      const activeAction=document.activeElement?.dataset.action;
      controls();
      if(activeAction) $('controls').querySelector('[data-action="'+activeAction+'"]')?.focus();
    }
  }
  async function selectLesson(index) {
    const token = ++switchToken;
    presentationReady = false; presentation?.dispose();presentation=null;
    current = index; lesson = manifest.lessons[index];
    if(!lesson) throw new Error('Unknown lesson index');
    model = externalPlugin || getModel(lesson.plugin_id);
    state = model.initialState(); lastAssessment=null; stage=$('stage');stage.replaceChildren();stage.style.visibility='visible';document.getElementById('flat-overlay')?.remove();
    $('title').textContent = lesson.title;
    $('prompt').textContent = lesson.prompt;
    $('eyebrow').textContent = (lesson.audience_label || 'Age ' + lesson.age) + ' · ' + lesson.subject + ' · ' + (index+1) + ' of ' + manifest.lessons.length;
    $('feedback').textContent = ''; $('feedback').removeAttribute('data-correct');
    $('controls').replaceChildren();
    document.querySelector('.explain summary').textContent='Explain it · Notes for grown-ups';
    $('explanation').innerHTML = '<p>' + escapeHtml(lesson.assessment_prompt?.replaceAll('{{name}}','the learner')) + '</p><p>Use this activity to start a conversation, then try a different example together.</p><ul>' + lesson.assumptions.map(a => '<li>' + escapeHtml(a) + '</li>').join('') + '</ul><p>A correct response is one observation. It does not establish overall understanding of the topic.</p>';
    const nav = document.querySelector('.lesson-nav');nav.replaceChildren();
    manifest.lessons.forEach((item,i) => {const button=document.createElement('button');button.textContent=item.name;button.setAttribute('aria-current',i===index?'step':'false');button.addEventListener('click',()=>selectLesson(i));nav.append(button);});
    controls();
    let nextPresentation = null;
    const selectedLesson = lesson;
    if (externalPlugin?.createPresentation) nextPresentation = await externalPlugin.createPresentation(stage, {controlsRoot:$('controls'),dispatch, getState:()=>structuredClone(state)});
    else if(lesson.route.representation === 'threejs' && !new URLSearchParams(location.search).has('accessible')) {
      try { const {createThreeStage}=await import('./three-stage.mjs');if(token!==switchToken)return;nextPresentation=await createThreeStage(stage,selectedLesson.plugin_id,{asset:selectedLesson.asset}); }
      catch(error){ selectedLesson.runtime_fallback='3D is unavailable here. This text view supports the explanation, but cannot provide the full spatial experiment.'; console.warn(selectedLesson.runtime_fallback); }
    }
    if(token !== switchToken){nextPresentation?.dispose();return;}
    presentation = nextPresentation;
    render();presentationReady=true;
    document.getElementById('fallback-notice')?.remove();
    if(selectedLesson.runtime_fallback || (selectedLesson.route.representation==='threejs'&&!presentation)) {
      selectedLesson.runtime_fallback=selectedLesson.runtime_fallback||'Accessible explanation view: the full spatial interaction is not available in this mode.';
      const notice=document.createElement('p');notice.id='fallback-notice';notice.className='error';notice.setAttribute('role','status');notice.textContent=selectedLesson.runtime_fallback;$('prompt').after(notice);
    }
    if(!isVideo && !reduced) gsap.fromTo('.stage-wrap',{opacity:.6},{opacity:1,duration:.3,overwrite:true});
    return snapshot();
  }
  function snapshot(){return {lesson_index:current,topic_id:lesson?.topic_id,plugin_id:lesson?.plugin_id,state:structuredClone(state),observed:readout(),assessment:lastAssessment,ready:presentationReady,presentation:presentation?.info || {renderer:'html_svg'},runtime_fallback:lesson?.runtime_fallback||null};}
  function reset(){state=model.initialState();lastAssessment=null;$('feedback').textContent='';$('feedback').removeAttribute('data-correct');controls();render();}
  function check(){lastAssessment=model.assess(state);$('feedback').textContent=lastAssessment.message;$('feedback').dataset.correct=String(lastAssessment.correct);presentation?.onAssessment?.(lastAssessment);return lastAssessment;}
  app.addEventListener('change',event=>{const e=event.target;if(e.matches('select[data-action]'))dispatch({type:e.dataset.action,value:e.dataset.action==='denominator'?Number(e.value):e.value});});
  app.addEventListener('input',event=>{const e=event.target;if(e.matches('input[data-action]'))dispatch({type:e.dataset.action,value:Number(e.value)});});
  app.addEventListener('click',event=>{const e=event.target.closest('button[data-action]');if(e){const value=e.dataset.value;dispatch({type:e.dataset.action,value:['true','false'].includes(value)?value==='true':value});}});
  $('check').addEventListener('click',check);$('reset').addEventListener('click',reset);
  const api={snapshot,dispatch,check,reset,selectLesson,renderAt(time){state=replay(model,lesson.scenario,time);lastAssessment=null;$('feedback').textContent=isVideo?'A scripted demonstration. Try the interactive lesson to explore for yourself.':'';$('feedback').removeAttribute('data-correct');controls();render(time,{seeking:true});return snapshot();}};
  globalThis.lessonAPI=api;
  globalThis.addEventListener('hf-seek',event=>{if(presentationReady)api.renderAt(event.detail.time);});
  await selectLesson(0);
  if(isVideo) {
    const duration=Number(document.querySelector('[data-composition-id]').dataset.duration);
    const clock={time:0};
    const timeline=gsap.timeline({paused:true}).to(clock,{time:duration,duration,ease:'none',onUpdate:()=>api.renderAt(clock.time)});
    globalThis.__timelines=globalThis.__timelines||{};
    globalThis.__timelines.lesson=timeline;
  }
  globalThis.__lessonReady=true;
  return api;
}
