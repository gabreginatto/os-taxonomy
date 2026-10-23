import { phases, cycleTerms } from '../models.mjs';
const svg = body => '<svg viewBox="0 0 700 300" role="img" aria-labelledby="sceneTitle"><title id="sceneTitle">Learning diagram</title>' + body + '</svg>';
const text = (x, y, value, size = 18, fill = '#193343') => '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="system-ui,sans-serif" font-size="' + size + '" fill="' + fill + '">' + value + '</text>';
const safe = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function renderSvg(root, kind, o) {
  if (kind === 'fractions') {
    let body = text(350, 32, 'One whole. Two ways to divide it.', 22);
    for (const [n, d, y, label] of [[1, 2, 65, '1/2'], [o.numerator, o.denominator, 180, o.label]]) {
      for (let i = 0; i < d; i++) body += '<rect x="' + (100 + i * 500 / d) + '" y="' + y + '" width="' + (500 / d) + '" height="65" fill="' + (i < n ? '#118b87' : '#fffcf3') + '" stroke="#193343" stroke-width="2"/>';
      body += text(350, y + 90, label, 22);
    }
    root.innerHTML = svg(body); return;
  }
  if (kind === 'water') {
    const positions = [[135,175],[260,65],[470,65],[565,175]];
    let body = '<path d="M155 135 Q175 60 220 65 M310 65 H415 M510 85 Q555 95 560 140 M520 205 Q350 280 180 205" fill="none" stroke="#638b8b" stroke-width="8" stroke-linecap="round"/>';
    cycleTerms.forEach((term, i) => { const [x,y] = positions[i]; body += '<circle cx="' + x + '" cy="' + y + '" r="48" fill="' + (o.stage === term ? '#e9ae48' : '#fffcf3') + '" stroke="#193343" stroke-width="2"/>' + text(x,y+7,String(i+1),24) + text(x,y+70,term,16); });
    root.innerHTML = svg(body); return;
  }
  if (kind === 'moon') {
    const p = o.phase;
    let shape = '';
    // This is a qualitative appearance diagram, not a quantitative orbital model.
    if (p === 4) shape = '<circle cx="350" cy="135" r="85" fill="#fff5c9"/>';
    else if (p !== 0) {
      const right = p < 4, crescent = p === 1 || p === 7, gibbous = p === 3 || p === 5;
      shape = '<path d="' + (right ? 'M350 50 A85 85 0 0 1 350 220 Z' : 'M350 50 A85 85 0 0 0 350 220 Z') + '" fill="#fff5c9"/>';
      if (crescent) shape += '<ellipse cx="350" cy="135" rx="58" ry="85" fill="#29374e"/>';
      if (gibbous) shape += '<ellipse cx="350" cy="135" rx="58" ry="85" fill="#fff5c9"/>';
    }
    root.innerHTML = svg('<rect width="700" height="300" rx="20" fill="#182939"/><circle cx="110" cy="65" r="2" fill="white"/><circle cx="580" cy="130" r="2" fill="white"/><circle cx="490" cy="40" r="3" fill="white"/><circle cx="350" cy="135" r="85" fill="#29374e"/>' + shape + text(350,265,safe(phases[p]),22,'#fff5c9')); return;
  }
  if (kind === 'sentences') {
    root.innerHTML = '<div class="word-scene"><span class="word">The dog</span>' + (o.verb ? '<span class="word verb">ran</span>' : '<span class="word" style="border:2px dashed #9aab9d">…</span>') + (o.detail ? '<span class="word detail">quickly</span>' : '') + '</div>'; return;
  }
  if (kind === 'shapes') {
    root.innerHTML = o.classification === 'flat' ? '<div class="flat-shape ' + safe(o.shape) + '" role="img" aria-label="' + safe(o.shape) + '"></div>' : '<div class="fallback"><strong>' + safe(o.shape) + '</strong><br>A solid object has depth. Its appearance changes as you turn it.</div>'; return;
  }
  root.innerHTML = '<div class="fallback"><strong>' + safe(o.period || '') + '</strong><br>' + (o.facing > 0 ? 'The observer faces sunlight.' : 'The observer faces away from sunlight.') + '<br>Use the rotation control to change the observer’s position.</div>';
}
