'use strict';
// One browser preference for the homepage and every portfolio route.
(function () {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: light)');
  let saved = null;
  try { saved = localStorage.getItem('za-theme'); } catch (error) { /* Use system preference. */ }
  if (saved !== 'light' && saved !== 'dark') saved = null;
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0e14' : '#f6f8fb');
    const button = document.querySelector('.theme-toggle');
    if (button) button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    window.dispatchEvent(new Event('za-themechange'));
  }
  applyTheme(saved || (preference.matches ? 'light' : 'dark'));
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.hidden = false;
    applyTheme(root.getAttribute('data-theme'));
    button.addEventListener('click', () => {
      saved = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('za-theme', saved); } catch (error) { /* Theme still works. */ }
      applyTheme(saved);
    });
  });
  preference.addEventListener('change', () => {
    if (!saved) applyTheme(preference.matches ? 'light' : 'dark');
  });
})();
