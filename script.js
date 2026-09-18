'use strict';
const video = document.querySelector('#hero-video');
const toggle = document.querySelector('#video-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const progress = document.querySelector('#reel-progress-fill');
let userPaused = reducedMotion.matches;
let reelVisible = true;
const dialog = document.querySelector('#film-dialog');
const player = document.querySelector('#film-player');
let returnFocus = null;
const syncVideoButton = () => {
  toggle.textContent = video.paused ? 'Play ▶' : 'Pause Ⅱ';
  toggle.setAttribute('aria-label', video.paused ? 'Play teaser' : 'Pause teaser');
};
const resumeTeaser = () => {
  if (!userPaused && reelVisible && !document.hidden && !dialog.open) video.play().catch(syncVideoButton);
};
video.addEventListener('play', syncVideoButton);
video.addEventListener('pause', syncVideoButton);
video.addEventListener('timeupdate', () => {
  if (Number.isFinite(video.duration) && video.duration > 0) progress.style.transform = `scaleX(${video.currentTime / video.duration})`;
});
video.muted = true;
if (reducedMotion.matches) { video.autoplay = false; video.pause(); } else resumeTeaser();
syncVideoButton();
toggle.addEventListener('click', () => {
  userPaused = !video.paused;
  if (video.paused) video.play().catch(syncVideoButton); else video.pause();
});
new IntersectionObserver(entries => {
  reelVisible = entries[0].isIntersecting;
  if (!reelVisible) video.pause(); else resumeTeaser();
}, {threshold: .1}).observe(document.querySelector('.reel-frame'));
document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else resumeTeaser(); });
video.addEventListener('error', () => { toggle.textContent = 'Video unavailable'; toggle.disabled = true; });

// One consistent, restrained motion language; content remains visible without JavaScript.
const motionOptions = {duration: 650, easing: 'cubic-bezier(.2,.75,.25,1)'};
function reveal(element, delay = 0) {
  if (reducedMotion.matches || !element.animate) return;
  element.animate([{opacity: .25, transform: 'translateY(18px)'}, {opacity: 1, transform: 'translateY(0)'}], {...motionOptions, delay});
}
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { reveal(entry.target); revealObserver.unobserve(entry.target); } });
}, {threshold: .12});
document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));
reveal(document.querySelector('.hero-identity'));
reveal(document.querySelector('.hero-reel'), 100);
reducedMotion.addEventListener('change', event => {
  if (event.matches) {
    userPaused = true; video.pause();
    document.getAnimations().forEach(animation => animation.cancel());
  }
});

const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.project')];
filters.forEach(button => button.addEventListener('click', () => {
  if (button.getAttribute('aria-pressed') === 'true') return;
  const previous = new Map(cards.filter(card => !card.hidden).map(card => [card, card.getBoundingClientRect()]));
  filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; if (!card.hidden) count++; });
  document.querySelector('.work-count').textContent = `${count} films`;
  if (!reducedMotion.matches) cards.filter(card => !card.hidden).forEach((card, index) => {
    const old = previous.get(card), next = card.getBoundingClientRect();
    if (old) card.animate([{transform: `translate(${old.left - next.left}px, ${old.top - next.top}px)`}, {transform: 'translate(0,0)'}], {duration: 450, easing: motionOptions.easing});
    else reveal(card, Math.min(index, 4) * 35);
  });
}));
document.querySelectorAll('[data-video]').forEach(link => link.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialog.showModal) return;
  event.preventDefault(); returnFocus = link;
  document.querySelector('#film-title').textContent = link.dataset.title;
  document.querySelector('#youtube-link').href = link.href;
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${link.dataset.video}?autoplay=1&rel=0`;
  frame.title = link.dataset.title;
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  player.replaceChildren(frame);
  dialog.showModal(); document.body.classList.add('modal-open'); video.pause();
  if (!reducedMotion.matches) dialog.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:250,easing:motionOptions.easing});
}));
document.querySelector('#close-film').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }
});
dialog.addEventListener('close', () => { player.replaceChildren(); document.body.classList.remove('modal-open'); returnFocus?.focus(); resumeTeaser(); });
