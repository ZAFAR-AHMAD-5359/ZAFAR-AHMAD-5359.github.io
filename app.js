'use strict';
const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
function closeMenu(returnFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
  menuButton.querySelector('span').textContent = '+';
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
  menuButton.querySelector('span').textContent = open ? '−' : '+';
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
const narrowScreen = window.matchMedia('(max-width: 760px)');
narrowScreen.addEventListener('change', () => closeMenu());
// Collapse mobile navigation only after its controls are ready.
// If this script fails or is disabled, the ordinary links remain available.
document.documentElement.classList.add('nav-ready');
