'use strict';
// Homepage navigation only. The figures are static inline SVG; the theme toggle lives in theme.js.
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
