/* Shared behaviour for every page: smooth scroll, nav, loader, reveals, small interactions. */
gsap.registerPlugin(ScrollTrigger);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Lenis smooth scroll, synced with ScrollTrigger ---------- */
const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduceMotion, wheelMultiplier: 0.9 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
window.lenis = lenis;

/* ---------- Loader ---------- */
const loader = document.querySelector('.loader');
function hideLoader() {
  if (!loader || loader.dataset.done) return;
  loader.dataset.done = 1;
  gsap.timeline()
    .to('.loader-fill', { scaleX: 1, duration: 0.4, ease: 'power2.out' })
    .to(loader, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.15')
    .add(() => { loader.remove(); document.body.classList.add('ready'); introAnimation(); }, '-=0.35');
}
window.addEventListener('load', () => setTimeout(hideLoader, 2500)); // safety net

/* ---------- Scroll scrubbers ---------- */
const scrubs = [...document.querySelectorAll('.scrub')];
let readyCount = 0;
scrubs.forEach((s) => new FrameScrub(s, () => { if (++readyCount === scrubs.length) setTimeout(hideLoader, 350); }));
if (!scrubs.length) window.addEventListener('load', () => setTimeout(hideLoader, 300));

/* ---------- Intro (first screen) ---------- */
function introAnimation() {
  const words = document.querySelectorAll('.intro .word > span');
  gsap.from(words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.07 });
  gsap.from('.intro .intro-fade', { opacity: 0, y: 20, duration: 1, ease: 'power3.out', delay: 0.45, stagger: 0.1 });
  gsap.from('.site-nav', { opacity: 0, y: -16, duration: 0.8, ease: 'power3.out', delay: 0.3 });
}

/* ---------- Split headings into words for reveal ---------- */
document.querySelectorAll('[data-split]').forEach((el) => {
  el.innerHTML = el.textContent.trim().split(/\s+/)
    .map((w) => `<span class="word"><span>${w}</span></span>`).join(' ');
  if (el.closest('.intro')) return;
  gsap.from(el.querySelectorAll('.word > span'), {
    yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.05,
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

/* ---------- Generic reveals ---------- */
gsap.utils.toArray('[data-reveal]').forEach((el) => {
  gsap.from(el, {
    opacity: 0, y: 40, duration: 1.1, ease: 'power3.out',
    delay: +el.dataset.delay || 0,
    scrollTrigger: { trigger: el, start: 'top 88%' }
  });
});

/* ---------- Parallax images ---------- */
gsap.utils.toArray('[data-parallax]').forEach((el) => {
  gsap.fromTo(el, { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
  });
});

/* ---------- Counters ---------- */
gsap.utils.toArray('[data-count-to]').forEach((el) => {
  const o = { v: 0 }, to = +el.dataset.countTo;
  gsap.to(o, {
    v: to, duration: 2, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 90%' },
    onUpdate: () => (el.textContent = el.hasAttribute("data-plain") ? Math.round(o.v) : Math.round(o.v).toLocaleString("en-IN"))
  });
});

/* ---------- Nav: solid after the first screen, hide on scroll down ---------- */
const nav = document.querySelector('.site-nav');
let lastY = 0;
lenis.on('scroll', ({ scroll }) => {
  // stay transparent while the camera tour is playing, go solid once regular content starts
  const firstScrub = scrubs[0];
  const solidAt = firstScrub ? firstScrub.offsetTop + firstScrub.offsetHeight - window.innerHeight * 0.95 : window.innerHeight * 0.6;
  nav.classList.toggle('is-solid', scroll > solidAt);
  nav.classList.toggle('is-hidden', scroll > lastY && scroll > 300 && !document.body.classList.contains('menu-open'));
  lastY = scroll;
});

/* ---------- Mobile menu ---------- */
const menuBtn = document.querySelector('.menu-btn');
menuBtn && menuBtn.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', open);
  open ? lenis.stop() : lenis.start();
  if (open) gsap.from('.mobile-menu a', { y: 40, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out', delay: 0.15 });
});

/* ---------- Magnetic buttons ---------- */
if (window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3);
      yTo((e.clientY - r.top - r.height / 2) * 0.3);
    });
    el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------- Page transition on internal links ---------- */
const curtain = document.querySelector('.curtain');
document.querySelectorAll('a[href$=".html"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || a.target === '_blank') return;
    e.preventDefault();
    gsap.to(curtain, { yPercent: 0, duration: 0.6, ease: 'expo.inOut', onComplete: () => (location.href = a.href) });
  });
});
gsap.set(curtain, { yPercent: 100 });
window.addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(curtain, { yPercent: 100 }); });

/* ---------- Footer year ---------- */
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
