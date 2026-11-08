(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionEnabled = !reducedMotion.matches;
  try { const choice = localStorage.getItem('herbert-motion'); if (choice !== null) motionEnabled = choice === 'on' && !reducedMotion.matches; } catch {}
  const menuButton = $('.menu-toggle');
  const navigation = $('#navigation');
  function closeMenu() { navigation.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
  menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; navigation.classList.toggle('open', open); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });

  const progress = $('.scroll-progress');
  let scrollTicking = false;
  function updateProgress() { const length = document.documentElement.scrollHeight - window.innerHeight; progress.style.transform = `scaleX(${length > 0 ? window.scrollY / length : 0})`; scrollTicking = false; }
  window.addEventListener('scroll', () => { if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(updateProgress); } }, {passive: true});
  window.addEventListener('resize', updateProgress);
  updateProgress();

  function applyMotion() { document.documentElement.classList.toggle('motion-off', !motionEnabled); const button = $('.motion-toggle'); button.setAttribute('aria-pressed', String(motionEnabled)); button.setAttribute('aria-label', motionEnabled ? 'Turn animation off' : 'Turn animation on'); $('.motion-label').textContent = motionEnabled ? 'Motion on' : 'Motion off'; $('.motion-icon').textContent = motionEnabled ? 'Ⅱ' : '▷'; if (!motionEnabled) $$('.reveal').forEach(element => element.classList.add('visible')); }
  $('.motion-toggle').addEventListener('click', () => { motionEnabled = !motionEnabled; try { localStorage.setItem('herbert-motion', motionEnabled ? 'on' : 'off'); } catch {} applyMotion(); });
  reducedMotion.addEventListener('change', () => { motionEnabled = !reducedMotion.matches; applyMotion(); });
  applyMotion();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, {threshold: 0.06});
    $$('.section-intro, .credentials-grid, .contact-layout').forEach(element => { element.classList.add('reveal'); observer.observe(element); });
    if (motionEnabled) document.documentElement.classList.add('js-motion');
    const sectionObserver = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { $$('#navigation a').forEach(link => { const active = link.getAttribute('href') === `#${entry.target.id}`; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); } }); }, {rootMargin: '-20% 0px -55% 0px', threshold: 0});
    $$('#experience, #education, #contact').forEach(section => sectionObserver.observe(section));
  }
  function syncExperience() { const hash = location.hash; const target = hash ? document.getElementById(hash.slice(1)) : null; if (target && target.matches('details')) target.open = true; }
  window.addEventListener('hashchange', syncExperience);
  syncExperience();
  $$('.affiliation').forEach(link => link.addEventListener('click', () => { const target = document.querySelector(link.getAttribute('href')); if (target) target.open = true; }));
  $$('.experience-item').forEach(item => item.addEventListener('toggle', updateProgress));
  $('#year').textContent = String(new Date().getFullYear());
})();
