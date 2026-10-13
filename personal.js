'use strict';
// Accessible navigation; banner uses textbook waveforms, never recordings or inference.
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuButton = document.querySelector('.home-menu-toggle');
const homeNav = document.getElementById('home-nav');
function closeHomeMenu(returnFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  homeNav.classList.remove('open');
  if (returnFocus) menuButton.focus();
}
menuButton.hidden = false;
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  homeNav.classList.toggle('open', open);
});
homeNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeHomeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && homeNav.classList.contains('open')) closeHomeMenu(true);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.topbar')) closeHomeMenu();
});
window.matchMedia('(max-width: 980px)').addEventListener('change', () => closeHomeMenu());
document.documentElement.classList.add('home-nav-ready');
const motion = document.querySelector('.scope-motion');
let paused = false;
/* Oscilloscope banner. */
const canvas = document.getElementById('scope');
const ctx = canvas ? canvas.getContext('2d') : null;
let colours = {};
let running = false, visible = true, last = 0, phase = 0, raf = 0;
function readColours() {
  const cs = getComputedStyle(root);
  colours = { ecg: cs.getPropertyValue('--ecg').trim(), pcg: cs.getPropertyValue('--accent').trim(),
              grid: cs.getPropertyValue('--border').trim(), text: cs.getPropertyValue('--muted').trim() };
}
const g = (x, m, w) => Math.exp(-((x - m) * (x - m)) / (2 * w * w));
// One cardiac cycle on t in [0, 1): P, QRS, T for ECG; S1 shortly after QRS, S2 near the end of T.
function ecg(t) { return 0.12 * g(t, 0.09, 0.022) - 0.10 * g(t, 0.178, 0.006) + 1.0 * g(t, 0.19, 0.007) - 0.22 * g(t, 0.203, 0.007) + 0.28 * g(t, 0.42, 0.045); }
function pcg(t) {
  const s1 = g(t, 0.235, 0.016) * Math.sin(t * 2 * Math.PI * 38);
  const s2 = 0.75 * g(t, 0.505, 0.012) * Math.sin(t * 2 * Math.PI * 52);
  return s1 + s2;
}
function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(r.width * dpr));
  canvas.height = Math.max(1, Math.round(r.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!running) drawFrame(0);
}
function drawFrame(dt) {
  if (!ctx) return;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  phase = (phase + dt * 0.00018) % 1;
  ctx.clearRect(0, 0, w, h);
  // graticule
  ctx.lineWidth = 1;
  ctx.strokeStyle = colours.grid; ctx.globalAlpha = 0.55;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 28) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
  for (let y = 0; y <= h; y += 28) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
  ctx.stroke();
  ctx.globalAlpha = 1;
  const beats = Math.max(2.2, w / 260);           // cycles across the screen
  const trace = (fn, colour, baseline, gain) => {
    ctx.strokeStyle = colour; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    ctx.shadowColor = colour; ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 1.5) {
      const t = ((x / w) * beats + phase * beats) % 1;
      const y = baseline - fn(t) * gain;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };
  trace(ecg, colours.ecg, h * 0.42, h * 0.27);
  trace(pcg, colours.pcg, h * 0.78, h * 0.15);
  // sweep cursor
  const sx = ((performance.now() / 22) % (w + 60)) - 30;
  const grad = ctx.createLinearGradient(sx - 40, 0, sx, 0);
  grad.addColorStop(0, 'transparent'); grad.addColorStop(1, colours.pcg);
  ctx.globalAlpha = running ? 0.18 : 0; ctx.fillStyle = grad; ctx.fillRect(sx - 40, 0, 40, h); ctx.globalAlpha = 1;
}
function loop(ts) {
  const dt = last ? Math.min(ts - last, 64) : 16;
  last = ts;
  drawFrame(dt);
  raf = requestAnimationFrame(loop);
}
function start() { if (running || paused || reduceMotion.matches || !visible || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
function stop() { running = false; cancelAnimationFrame(raf); drawFrame(0); }
if (canvas && ctx) {
  readColours();
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('za-themechange', () => { readColours(); drawFrame(0); });
  function syncMotion() {
    motion.disabled = reduceMotion.matches;
    motion.setAttribute('aria-pressed', String(paused));
    motion.querySelector('span').textContent = reduceMotion.matches ? 'Motion reduced' : paused ? 'Motion paused' : 'Pause motion';
    if (paused || reduceMotion.matches) stop(); else start();
  }
  motion.hidden = false;
  motion.addEventListener('click', () => { paused = !paused; syncMotion(); });
  syncMotion();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduceMotion.addEventListener('change', syncMotion);
  start();
}
