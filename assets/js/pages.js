/* Page-specific bits: menu filter, FAQ, reservation form, "open now" badge. */

/* ---------- Menu filter ---------- */
const tabs = document.querySelectorAll('.tab');
tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach((t) => t.setAttribute('aria-selected', t === tab));
  const f = tab.dataset.filter;
  const items = [...document.querySelectorAll('.menu-item')];
  gsap.to(items, {
    opacity: 0, y: 12, duration: 0.2, stagger: 0.01, onComplete: () => {
      items.forEach((i) => i.classList.toggle('is-out', f !== 'all' && i.dataset.cat !== f));
      const shown = items.filter((i) => !i.classList.contains('is-out'));
      gsap.fromTo(shown, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out' });
      ScrollTrigger.refresh();
    }
  });
}));

/* ---------- FAQ accordion ---------- */
document.querySelectorAll('.faq button').forEach((btn) => btn.addEventListener('click', () => {
  const faq = btn.closest('.faq');
  const open = !faq.classList.contains('open');
  document.querySelectorAll('.faq.open').forEach((f) => { f.classList.remove('open'); f.querySelector('button').setAttribute('aria-expanded', false); });
  faq.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', open);
  setTimeout(() => ScrollTrigger.refresh(), 550);
}));

/* ---------- Open now badge ---------- */
const openNow = document.getElementById('open-now');
if (openNow) {
  const d = new Date(), day = d.getDay(), mins = d.getHours() * 60 + d.getMinutes();
  const close = (day === 0 || day >= 5) ? 23 * 60 + 30 : 22 * 60;
  const isOpen = mins >= 8 * 60 && mins < close;
  openNow.innerHTML = isOpen
    ? '<span class="inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle"></span> Open right now'
    : '<span class="inline-block h-2 w-2 rounded-full bg-rose-deep align-middle"></span> Closed now, we open at 8 am';
}

/* ---------- Reservation form ---------- */
const form = document.getElementById('reserve-form');
if (form) {
  let guests = 2;
  const out = document.getElementById('guests');
  form.querySelectorAll('.guest-btn').forEach((b) => b.addEventListener('click', () => {
    guests = Math.min(8, Math.max(1, guests + +b.dataset.step));
    out.textContent = guests;
    gsap.fromTo(out, { scale: 1.3 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
  }));

  const date = form.date;
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  date.min = today.toISOString().slice(0, 10);

  const rules = {
    name: (v) => v.trim().length >= 2 || 'Please tell us your name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'That email doesn\'t look right.',
    date: (v) => (v && v >= date.min) || 'Pick today or a later date.',
    time: (v) => !!v || 'Choose a time.'
  };
  const check = (el) => {
    const r = rules[el.name](el.value);
    const msg = r === true ? '' : r;
    el.classList.toggle('is-invalid', !!msg);
    el.parentElement.querySelector('.error-text').textContent = msg;
    return !msg;
  };
  Object.keys(rules).forEach((n) => form[n].addEventListener('blur', () => check(form[n])));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = Object.keys(rules).map((n) => check(form[n])).every(Boolean);
    if (!ok) { gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }); return; }
    const when = new Date(form.date.value).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const box = document.getElementById('form-success');
    box.innerHTML = `<p class="font-display text-2xl font-extrabold">Thank you, ${form.name.value.trim().split(' ')[0]}!</p>
      <p class="mt-2 text-cocoa/70">Table for ${guests} on ${when} at ${form.time.value}. In a real café you'd get a confirmation at ${form.email.value.trim()}.</p>`;
    box.classList.remove('hidden');
    gsap.from(box, { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' });
    form.reset(); guests = 2; out.textContent = 2;
  });
}
