/*
  Scroll-scrubbed "camera" sections.
  Markup:
    <section class="scrub" data-seq="home" data-count="321" data-length="900">
      <div class="scrub-stage">
        <canvas></canvas>
        <div class="scene" data-from="1" data-to="70"> ...text... </div>
      </div>
    </section>
  data-length is the scroll distance in vh. Scenes fade in/out by frame number.
*/
(function () {
  const isSmall = () => window.matchMedia('(max-width: 768px)').matches;
  const FADE = 10; // frames used to fade a scene in or out

  class FrameScrub {
    constructor(section, onFirstReady) {
      this.section = section;
      this.seq = section.dataset.seq;
      this.count = +section.dataset.count;
      this.size = isSmall() ? 'sm' : 'lg';
      this.canvas = section.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.scenes = [...section.querySelectorAll('.scene')].map(el => ({
        el, from: +el.dataset.from, to: +el.dataset.to,
        keep: el.hasAttribute('data-keep-start'), hold: el.hasAttribute('data-keep-end')
      }));
      this.images = new Array(this.count);
      this.state = { frame: 1 };
      this.loaded = 0;
      this.onFirstReady = onFirstReady;
      section.style.height = (+section.dataset.length || 600) + 'vh';
      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize);
      this.resize();
      this.load();
      this.bindScroll();
    }

    src(i) {
      return `assets/frames/${this.seq}/${this.size}/${String(i).padStart(4, '0')}.webp`;
    }

    load() {
      // first frame + every 8th first, so scrubbing works early; then fill the gaps
      const order = [];
      for (let i = 1; i <= this.count; i += 8) order.push(i);
      for (let i = 1; i <= this.count; i++) if ((i - 1) % 8) order.push(i);
      let first = true;
      const next = (k) => {
        if (k >= order.length) return;
        const i = order[k];
        const img = new Image();
        img.decoding = 'async';
        img.onload = img.onerror = () => {
          this.images[i - 1] = img.naturalWidth ? img : null;
          this.loaded++;
          if (first && i === 1) { first = false; this.draw(); this.onFirstReady && this.onFirstReady(); }
          if (this.section.dataset.progress !== undefined) this.section.dataset.progress = this.loaded / this.count;
          next(k + 4);
        };
        img.src = this.src(i);
      };
      for (let k = 0; k < 4; k++) next(k); // 4 parallel loaders
    }

    nearest(i) {
      for (let d = 0; d < this.count; d++) {
        if (this.images[i - d]) return this.images[i - d];
        if (this.images[i + d]) return this.images[i + d];
      }
      return null;
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = this.canvas.getBoundingClientRect();
      this.canvas.width = Math.round(r.width * dpr);
      this.canvas.height = Math.round(r.height * dpr);
      this.draw();
    }

    cover(img, alpha) {
      const cw = this.canvas.width, ch = this.canvas.height;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      this.ctx.globalAlpha = alpha;
      this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }

    draw() {
      const f = Math.min(Math.max(this.state.frame, 1), this.count);
      const i = Math.floor(f) - 1, t = f - Math.floor(f);
      const a = this.images[i] || this.nearest(i);
      if (!a) return;
      this.cover(a, 1);
      // blend toward the next frame so 16fps source still feels fluid
      const b = this.images[i + 1];
      if (b && t > 0.02) this.cover(b, t);
      this.ctx.globalAlpha = 1;
      this.updateScenes(f);
    }

    updateScenes(f) {
      for (const s of this.scenes) {
        let o;
        if (f < s.from) o = s.keep ? 1 : 0;
        else if (f > s.to) o = s.hold ? 1 : 0;
        else o = Math.min(1, s.keep ? 1 : (f - s.from) / FADE, s.hold ? 1 : (s.to - f) / FADE);
        o = Math.max(0, o);
        if (s.o === o) continue;
        s.o = o;
        s.el.style.opacity = o;
        s.el.style.translate = `0 ${(1 - o) * 28}px`;
        s.el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      }
    }

    bindScroll() {
      gsap.to(this.state, {
        frame: this.count,
        ease: 'none',
        scrollTrigger: {
          trigger: this.section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          onUpdate: (st) => {
            const bar = this.section.querySelector('.scrub-progress span');
            if (bar) bar.style.transform = `scaleX(${st.progress})`;
          }
        },
        onUpdate: () => this.draw()
      });
    }
  }

  window.FrameScrub = FrameScrub;
})();
