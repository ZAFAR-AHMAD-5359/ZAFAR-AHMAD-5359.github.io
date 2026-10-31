'use strict';

// A deterministic teaching diagram, not a recording or a model output.
const points = 1100;
const gaussian = (x, mean, width) => Math.exp(-Math.pow((x - mean) / width, 2) / 2);
const waveform = (fn) => Array.from({length: points + 1}, (_, i) => {
  const t = i / points;
  return `${i ? 'L' : 'M'}${(t * 880).toFixed(2)},${fn(t).toFixed(2)}`;
}).join(' ');
// S1 and S2 sit inside the shared phase bands (S1 0–16%, S2 48–58%). The T wave ends at S2 onset and the
// next beat's P wave appears late in diastole. The systolic oscillation is an illustrative murmur.
document.getElementById('pcg-trace').setAttribute('d', waveform(t => {
  const envelope = 30 * gaussian(t,.085,.028) + 24 * gaussian(t,.53,.022) + 14 * gaussian(t,.31,.09);
  return 60 - envelope * (Math.sin(t * 530) + .45 * Math.sin(t * 913)) - 1.1 * Math.sin(t*187);
}));
document.getElementById('ecg-trace').setAttribute('d', waveform(t =>
  180 + 10*gaussian(t,.006,.005) - 47*gaussian(t,.02,.004) + 18*gaussian(t,.034,.006) - 12*gaussian(t,.40,.045) - 6*gaussian(t,.86,.03)
));

const idealisedName = 'Illustrative heart-sound trace (PCG) with an idealised ECG timing reference. The trace includes an illustrative systolic murmur. Shared bands identify the first heart sound (S1), systolic interval, second heart sound (S2) and diastolic interval. Not patient data or model performance.';
const soundName = 'Illustrative heart-sound trace (PCG), without a timing reference or phase divisions. The trace includes an illustrative systolic murmur. The quarter grid marks equal-time windows, the control used in the evaluation; the phase of each event is not explicit. Not patient data or model performance.';
const lab = document.querySelector('.signal-lab');
const chart = lab.querySelector('.signal-chart');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
modeButtons.forEach(button => button.addEventListener('click', () => {
  const isSound = button.dataset.mode === 'sound';
  lab.classList.toggle('sound-mode', isSound);
  chart.setAttribute('aria-label', isSound ? soundName : idealisedName);
  modeButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  document.getElementById('signal-explanation').textContent = isSound
    ? 'A sound recording contains rich acoustic detail. On its own, the phase of each event is not explicit; the quarter grid shows equal-time windows, the control the evaluation compares against.'
    : 'An accurate timing reference locates each sound within the cardiac phases. This alignment is idealised; the research question is how well learnt timing holds for unseen patients and recording systems.';
}));

// System diagram: illustrative signal geometry only. No patient inference.
const smallWave = (width, height, fn) => Array.from({length:241}, (_, i) => {
  const t = i / 240;
  return `${i ? 'L' : 'M'}${(t * width).toFixed(2)},${(height / 2 - fn(t)).toFixed(2)}`;
}).join(' ');
const soundShape = t => (Math.sin(t*177) + .3*Math.sin(t*299)) * (16*gaussian(t,.21,.06) + 12*gaussian(t,.64,.04) + 6*gaussian(t,.4,.09));
document.querySelector('[data-wave="source"]').setAttribute('d',smallWave(240,50,soundShape));
['a','b','c'].forEach((key, index) => {
  document.querySelector(`[data-wave="capture-${key}"]`).setAttribute('d',smallWave(80,100,t => (30-index*30) + Math.sin(t*(48+index*17))*(index === 1 ? 6 : 4)));
});
// Engine glyph uses the same phase definition as the teaching chart: R in S1, T ending at S2, next P in diastole.
document.querySelector('[data-wave="inferred"]').setAttribute('d',smallWave(180,40,t => 17*gaussian(t,.03,.012)-7*gaussian(t,.055,.012)+5*gaussian(t,.40,.05)+3*gaussian(t,.86,.03)));
document.querySelector('[data-wave="presence"]').setAttribute('d',smallWave(90,30,t => Math.sin(t*90)*10*gaussian(t,.5,.23)));

// Motion is opt-in: the figure is static until the visitor presses "Animate"; it stops again after a while.
const system = document.querySelector('.system-figure');
const motionToggle = document.getElementById('motion-toggle');
const motionLabel = motionToggle.querySelector('.motion-label');
const motionPreference = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
let animating = false;
let stopTimer = 0;
function setMotion() {
  const reduced = Boolean(motionPreference && motionPreference.matches);
  if (reduced) animating = false;
  system.classList.toggle('is-paused', !animating);
  if (reduced) {
    motionToggle.removeAttribute('aria-pressed');
    motionLabel.textContent = 'Motion reduced';
  } else {
    motionToggle.setAttribute('aria-pressed', String(animating));
    motionLabel.textContent = 'Animate';
  }
  motionToggle.disabled = reduced;
}
motionToggle.addEventListener('click', () => {
  animating = !animating;
  if (typeof clearTimeout === 'function') clearTimeout(stopTimer);
  if (animating && typeof setTimeout === 'function') stopTimer = setTimeout(() => { animating = false; setMotion(); }, 45000);
  setMotion();
});
if (motionPreference && motionPreference.addEventListener) motionPreference.addEventListener('change', setMotion);
setMotion();
const stageExplanations = [
  'The acoustic signal combines heart sounds, possible murmur patterns and background noise. The timing of heart sounds and murmurs within each beat carries information.',
  'A phonocardiogram (PCG) records heart sounds. The proposed acoustic-only inference path would use this recording without a simultaneous ECG sensor; evaluation can still use paired ECG data.',
  'The tested route estimates a timing reference from the heart sound and examines phase-based features. The dated finding below the figure states what it has and has not established.',
  'The research studies murmur presence, intensity grade, timing and shape. Grade describes murmur intensity, not disease severity. These are characterisation targets, not a confirmed diagnosis.'
];
const exploreButtons = [...document.querySelectorAll('[data-explore]')];
function selectStage(index) {
  exploreButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.explore) === index)));
  document.querySelectorAll('[data-stage]').forEach(node => node.setAttribute('data-active', String(Number(node.dataset.stage) === index)));
  document.getElementById('system-explanation').textContent = stageExplanations[index];
}
exploreButtons.forEach(button => button.addEventListener('click', () => selectStage(Number(button.dataset.explore))));
selectStage(0);
// Controls appear only once this script has drawn the traces.
document.documentElement.classList.add('pipeline-ready');
