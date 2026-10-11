'use strict';

// A deterministic teaching diagram, not a recording or a model output.
const points = 1100;
const gaussian = (x, mean, width) => Math.exp(-Math.pow((x - mean) / width, 2) / 2);
const waveform = (fn) => Array.from({length: points + 1}, (_, i) => {
  const t = i / points;
  return `${i ? 'L' : 'M'}${(t * 880).toFixed(2)},${fn(t).toFixed(2)}`;
}).join(' ');
// S1 and S2 sit inside the shared phase bands (S1 0–16%, S2 48–58%).
document.getElementById('pcg-trace').setAttribute('d', waveform(t => {
  const envelope = 30 * gaussian(t,.075,.035) + 24 * gaussian(t,.53,.022) + 14 * gaussian(t,.31,.09);
  return 60 - envelope * (Math.sin(t * 530) + .45 * Math.sin(t * 913)) - 1.1 * Math.sin(t*187);
}));
document.getElementById('ecg-trace').setAttribute('d', waveform(t =>
  180 + 10*gaussian(t,.006,.005) - 47*gaussian(t,.02,.004) + 18*gaussian(t,.034,.006) - 12*gaussian(t,.30,.039)
));

const idealisedName = 'Illustrative heart-sound trace (PCG) with an idealised ECG timing reference. Shared bands identify the first heart sound (S1), systolic interval, second heart sound (S2) and diastolic interval. Not patient data or model performance.';
const soundName = 'Illustrative heart-sound trace (PCG), without a timing reference or phase divisions. The phase of each event is not explicit. Not patient data or model performance.';
const lab = document.querySelector('.signal-lab');
const chart = lab.querySelector('.signal-chart');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
modeButtons.forEach(button => button.addEventListener('click', () => {
  const isSound = button.dataset.mode === 'sound';
  lab.classList.toggle('sound-mode', isSound);
  chart.setAttribute('aria-label', isSound ? soundName : idealisedName);
  modeButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  document.getElementById('signal-explanation').textContent = isSound
    ? 'A sound recording contains rich acoustic detail. On its own, the phase of each event is not explicit.'
    : 'An accurate timing reference locates each sound within the cardiac phases. This alignment is idealised; obtaining it automatically is the open research question.';
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
// Engine glyph uses the same phase definition as the teaching chart: R in S1, T in systole.
document.querySelector('[data-wave="inferred"]').setAttribute('d',smallWave(180,40,t => 17*gaussian(t,.03,.012)-7*gaussian(t,.055,.012)+5*gaussian(t,.30,.06)));
document.querySelector('[data-wave="presence"]').setAttribute('d',smallWave(90,30,t => Math.sin(t*90)*10*gaussian(t,.5,.23)));

const system = document.querySelector('.system-figure');
const motionToggle = document.getElementById('motion-toggle');
const motionLabel = motionToggle.querySelector('.motion-label');
const motionPreference = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
let pausedByUser = false;
// The toggle keeps one name ("Pause motion") and reports its state with aria-pressed.
function setMotion() {
  const reduced = Boolean(motionPreference && motionPreference.matches);
  const paused = pausedByUser || reduced;
  system.classList.toggle('is-paused', paused);
  if (reduced) {
    motionToggle.removeAttribute('aria-pressed');
    motionLabel.textContent = 'Motion reduced';
  } else {
    motionToggle.setAttribute('aria-pressed', String(pausedByUser));
    motionLabel.textContent = 'Pause motion';
  }
  motionToggle.disabled = reduced;
}
motionToggle.addEventListener('click', () => {pausedByUser = !pausedByUser;setMotion();});
if (motionPreference && motionPreference.addEventListener) motionPreference.addEventListener('change', setMotion);
setMotion();
const stageExplanations = [
  'The acoustic signal combines heart sounds, possible murmur patterns and background noise. The timing of heart sounds and murmurs within each beat carries information.',
  'A phonocardiogram (PCG) records heart sounds. The proposed acoustic-only inference path would use this recording without a simultaneous ECG sensor; evaluation can still use paired ECG data.',
  'The tested route reconstructs an ECG-like timing reference and examines phase-based features. In the October 2026 patient-grouped evaluation it did not establish added downstream value over equal-time windows.',
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
// Controls and animation appear only once this script has drawn the traces.
document.documentElement.classList.add('pipeline-ready');
