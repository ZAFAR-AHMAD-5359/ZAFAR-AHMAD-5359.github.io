'use strict';

// A deterministic teaching diagram, not a recording or a model output.
const points = 1100;
const gaussian = (x, mean, width) => Math.exp(-Math.pow((x - mean) / width, 2) / 2);
const waveform = (fn) => Array.from({length: points + 1}, (_, i) => {
  const t = i / points;
  return `${i ? 'L' : 'M'}${(t * 880).toFixed(2)},${fn(t).toFixed(2)}`;
}).join(' ');
document.getElementById('pcg-trace').setAttribute('d', waveform(t => {
  const envelope = 30 * gaussian(t,.075,.035) + 24 * gaussian(t,.55,.022) + 14 * gaussian(t,.31,.09);
  return 60 - envelope * (Math.sin(t * 530) + .45 * Math.sin(t * 913)) - 1.1 * Math.sin(t*187);
}));
document.getElementById('ecg-trace').setAttribute('d', waveform(t =>
  180 + 10*gaussian(t,.006,.005) - 47*gaussian(t,.02,.004) + 18*gaussian(t,.034,.006) - 12*gaussian(t,.30,.039)
));

const lab = document.querySelector('.signal-lab');
const chart = lab.querySelector('.signal-chart');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
modeButtons.forEach(button => button.addEventListener('click', () => {
  const isSound = button.dataset.mode === 'sound';
  lab.classList.toggle('sound-mode', isSound);
  chart.setAttribute('aria-label', isSound
    ? 'Illustrative heart-sound trace (PCG), without a timing reference or phase divisions. The phase of each event is not explicit. Not patient data or model performance.'
    : 'Illustrative heart-sound trace (PCG) and synthetic ECG timing reference. Shared bands identify first sound (S1), systolic interval, second sound (S2), and diastolic interval. Not patient data or model performance.');
  modeButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  document.getElementById('signal-explanation').textContent = isSound
    ? 'A sound recording contains rich acoustic detail. On its own, the phase of each event is not explicit.'
    : 'A timing reference helps locate the sound within estimated cardiac phases.';
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
document.querySelector('[data-wave="inferred"]').setAttribute('d',smallWave(180,40,t => 17*gaussian(t,.22,.015)-7*gaussian(t,.25,.014)+5*gaussian(t,.62,.075)));
document.querySelector('[data-wave="presence"]').setAttribute('d',smallWave(90,30,t => Math.sin(t*90)*10*gaussian(t,.5,.23)));

const system = document.querySelector('.system-figure');
const motionToggle = document.getElementById('motion-toggle');
const motionPreference = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
let pausedByUser = false;
function setMotion() {
  const reduced = Boolean(motionPreference && motionPreference.matches);
  const paused = pausedByUser || reduced;
  system.classList.toggle('is-paused', paused);
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.querySelector('.motion-label').textContent = reduced ? 'Motion reduced' : paused ? 'Play motion' : 'Pause motion';
  motionToggle.disabled = reduced;
}
motionToggle.addEventListener('click', () => {pausedByUser = !pausedByUser;setMotion();});
if (motionPreference && motionPreference.addEventListener) motionPreference.addEventListener('change', setMotion);
setMotion();
const stageExplanations = [
  'The acoustic signal combines heart sounds, possible murmur patterns, and background noise. Their timing carries information.',
  'A phonocardiogram (PCG) records heart sounds. The proposed acoustic-only inference path would use this recording without a simultaneous ECG sensor; evaluation can still use paired ECG data.',
  'The proposed path reconstructs an ECG-like timing reference and tests phase-based features. The tested synthetic timing route has not established added downstream value over equal-time windows.',
  'The research studies murmur presence, intensity grade, timing, and shape. Grade describes murmur intensity, not disease severity. These are characterisation targets, not a confirmed diagnosis.'
];
const exploreButtons = [...document.querySelectorAll('[data-explore]')];
function selectStage(index) {
  exploreButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.explore) === index)));
  document.querySelectorAll('[data-stage]').forEach(node => node.setAttribute('data-active', String(Number(node.dataset.stage) === index)));
  document.getElementById('system-explanation').textContent = stageExplanations[index];
}
exploreButtons.forEach(button => button.addEventListener('click', () => selectStage(Number(button.dataset.explore))));
selectStage(0);


