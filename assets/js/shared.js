/* Shared data + helpers for the invite designs (ported from the 9.html project's shared.js).
   The invite's content (WEDDING) and its settings (CONFIG) come from JSON the server writes into the page
   (templates/invites/page.html). CONFIG: { mode: live|preview|demo, slug, rsvpUrl, rsvpWhatsapp, inviteId, skipGate,
   guestLinks, scrollTo, branding, variant }. */
(function () {
  const read = id => { try { return JSON.parse(document.getElementById(id).textContent); } catch (e) { return {}; } };
  const WEDDING = read('invite-data'), CONFIG = read('invite-config');
  WEDDING.events = WEDDING.events || []; WEDDING.story = WEDDING.story || []; WEDDING.travel = WEDDING.travel || [];
  WEDDING.contacts = WEDDING.contacts || []; WEDDING.rsvp = WEDDING.rsvp || {}; WEDDING.song = WEDDING.song || {};
  // The demo only shows inside our preview frames; no right-click menu there, so no "View frame source".
  if (CONFIG.mode === 'demo') document.addEventListener('contextmenu', e => e.preventDefault());
  const slug = CONFIG.slug || '';  // live invites only
  // A guest's visit counts once per page load; previews, the editor and the demo never count.
  if (CONFIG.mode === 'live' && slug) {
    const seen = `/api/i/${encodeURIComponent(slug)}/seen`;
    try { if (!navigator.sendBeacon(seen)) throw 0; } catch (e) { fetch(seen, { method: 'POST', keepalive: true, credentials: 'same-origin' }).catch(() => {}); }
  }

  /* The palette's colours, for the canvas art that can't read CSS variables. */
  function tokens() {
    const cs = getComputedStyle(document.documentElement), t = {};
    for (const k of ['ink', 'ink2', 'blue', 'blue2', 'g1', 'g2', 'coral', 'rose', 'mag', 'leaf', 'paper']) t[k] = cs.getPropertyValue('--' + k).trim();
    return t;
  }

  // Every invite opens with an intro at the top; a restored scroll position on reload would skip it.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad2 = n => String(n).padStart(2, '0');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];

  /* The designs build their pages as HTML strings: host text enters them only through esc(), and only https links
     (or this site's own) reach an src or href. */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const safeUrl = u => /^https?:\/\/[^\s"'<>]+$/.test(u || '') && (u.startsWith('https://') || u.startsWith(location.origin)) ? u : '';
  const small = u => u.replace(/-l\.webp$/, '-s.webp');  // uploads keep a 640 px copy beside the large one
  // The host's focus point per photo (photos.focus: {large url: [x%, y%]}). The designs show photos with object-fit:
  // cover in their own shapes, so object-position keeps that spot in view; it is set on every <img> of that photo,
  // large or small, including ones a design adds later (the full-size viewer).
  const focus = (WEDDING.photos && WEDDING.photos.focus) || {};
  if (Object.keys(focus).length) {
    const aim = img => {
      const f = focus[(img.getAttribute('src') || '').replace(/-s\.webp$/, '-l.webp')];
      if (f) img.style.objectPosition = `${f[0]}% ${f[1]}%`;
    };
    const scan = n => n.nodeType === 1 && (n.tagName === 'IMG' ? aim(n) : n.querySelectorAll('img').forEach(aim));
    new MutationObserver(ms => ms.forEach(m => (m.type === 'attributes' ? aim(m.target) : m.addedNodes.forEach(scan))))
      .observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
    scan(document.documentElement);
  }
  const first = s => (s || '').trim().split(/\s+/)[0];
  const tel = p => (p || '').replace(/[^\d+]/g, '');
  const waNum = p => { const d = (p || '').replace(/\D/g, ''); return d.length === 10 ? '91' + d : d; };  // a bare 10-digit number is Indian

  /* A guest-name link (aaiyega.com/<slug>?to=Sharma family), on plans that have them: the name, tidied, or ''.
     Pages only ever write it with textContent or esc(). */
  const guestName = () => CONFIG.guestLinks
    ? (new URLSearchParams(location.search).get('to') || '').replace(/\s+/g, ' ').trim().slice(0, 80) : '';

  /* The editor's preview opens at the section being edited (config.scrollTo), gap px below the top. True if it did. */
  function scrollToEdited(gap = 16) {
    const at = CONFIG.scrollTo && document.getElementById(CONFIG.scrollTo);
    if (at) requestAnimationFrame(() => {
      const s = document.documentElement.style, was = s.scrollBehavior;
      s.scrollBehavior = 'auto'; scrollTo(0, at.getBoundingClientRect().top + scrollY - gap); s.scrollBehavior = was;
    });
    return !!at;
  }

  /* Shrinks text that overflows its box (a long name, a hashtag) in one pass: every element is measured at its CSS
     size, then its font scales by the room over what the text needs, so a page of names costs one layout, not one
     per pixel. A 1px step afterwards catches rounding. measure(el) gives [room, need] (default: the box's width and
     its content's); max (px, or a function of the element) caps it; grow lets text scale up to fill the room too. */
  function fit(els, { min = 12, max = Infinity, grow = false, measure = el => [el.clientWidth, el.scrollWidth] } = {}) {
    els = [...els].filter(Boolean);
    els.forEach(el => (el.style.fontSize = ''));
    const sizes = els.map(el => {
      const [room, need] = measure(el), cap = typeof max === 'function' ? max(el) : max;
      if (!need || (!grow && need <= room + 1)) return 0;
      return Math.max(min, Math.min(cap, parseFloat(getComputedStyle(el).fontSize) * room / need));
    });
    els.forEach((el, i) => { if (sizes[i]) el.style.fontSize = sizes[i] + 'px'; });
    if (!grow) els.forEach((el, i) => {
      for (let s = sizes[i]; s > min; s--) {
        const [room, need] = measure(el);
        if (need <= room + 1) break;
        el.style.fontSize = Math.max(min, s - 1) + 'px';
      }
    });
  }
  /* Runs a fit now, again once the web fonts are in, and after the screen's width changes (debounced: a phone's
     toolbar sliding in or out only changes the height). */
  function refit(fn) {
    fn();
    if (document.fonts) document.fonts.ready.then(fn);
    let w = innerWidth, t;
    addEventListener('resize', () => { if (innerWidth === w) return; w = innerWidth; clearTimeout(t); t = setTimeout(fn, 150); });
  }

  /* Line icons for a function card, picked from its id and name (Storybook and Rose Haveli). */
  const EV_IC = {
    mehendi: '<path d="M15 45c-.6-3-1-6-1-11 0 0-3.2-3-5.6-6.6-1.2-1.8.6-3.6 2.4-2.4L14 28V13a2 2 0 0 1 4 0v9-12a2 2 0 0 1 4 0v12-10a2 2 0 0 1 4 0v10-7a2 2 0 0 1 4 0v15c0 6-1.5 9-2 14"/><circle cx="22" cy="32" r="3.2"/><circle cx="22" cy="32" r=".9"/><path d="M22 26.6v-1.4M22 38.8v-1.4M16.6 32h-1.4M28.8 32h-1.4M16 41.5h13"/>',
    haldi: '<path d="M6 25h36c0 9-7.5 15-18 15S6 34 6 25z"/><path d="M18 40l-1 4h14l-1-4M11 25c2-6 8-9 13-9s11 3 13 9"/><path d="M24 16c-1-5 2-9 7-10 0 5-3 9-7 10zM24 16c2-3 4-6 7-10"/><circle cx="15" cy="12" r="3"/><circle cx="15" cy="12" r="1"/><path d="M15 9V7M15 17v-2M12 12h-2M20 12h-2"/>',
    party: '<path d="M5 12h15l-7.5 10zM12.5 22v13M8 35h9M28 12h15l-7.5 10zM35.5 22v13M31 35h9M24 4v5M19 6l2 3M29 6l-2 3"/><circle cx="10" cy="15" r="1.6"/><circle cx="38" cy="15" r="1.6"/>',
    wedding: '<path d="M5 43h38M10 43V21M38 43V21M7 21h34M8 21c2-8 9-13 16-15 7 2 14 7 16 15M24 6V3M10 25c4 5 24 5 28 0"/><circle cx="20.5" cy="35" r="4.5"/><circle cx="27.5" cy="35" r="4.5"/><path d="M27.5 28.5l1.5-2 1.5 2"/>',
  };
  const evKind = e => { const s = `${e.id} ${e.name}`; return /haldi|pithi|ubtan/i.test(s) ? 'haldi' : /mehendi|mehndi|henna/i.test(s) ? 'mehendi' : /sangeet|cocktail|party|reception|dance/i.test(s) ? 'party' : 'wedding'; };
  const evIcon = e => `<svg viewBox="0 0 48 48" class="ico" aria-hidden="true" stroke-width="1.6">${EV_IC[evKind(e)]}</svg>`;

  function countdown(cb, target = WEDDING.date) {
    const t = new Date(target).getTime();
    const tick = () => {
      let ms = Math.max(0, t - Date.now());
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4); ms -= m * 6e4;
      cb({ d, h, m, s: Math.floor(ms / 1e3), done: t <= Date.now() });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }

  const event = id => WEDDING.events.find(e => e.id === id);
  const mapUrl = ev => ev.map || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${ev.venue}, ${ev.address}`);
  const gcal = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  function calUrl(ev) {
    const start = new Date(ev.date), end = new Date(start.getTime() + (ev.hours || 3) * 36e5);
    const q = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${ev.name} · ${WEDDING.bride.name} & ${WEDDING.groom.name}`,
      dates: `${gcal(start)}/${gcal(end)}`,
      location: `${ev.venue}, ${ev.address}`,
      details: `${ev.note}${ev.dress ? ` Dress code: ${ev.dress}.` : ''} ${WEDDING.hashtag}`,
    });
    return 'https://calendar.google.com/calendar/render?' + q;
  }
  const waUrl = text => `https://wa.me/${(WEDDING.rsvp.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

  /* Falling / rising / burst particles on a canvas that fills its CSS box.
     shapes: petal heart glitter dot confetti marigold leaf lantern */
  function particles(canvas, o = {}) {
    const opt = Object.assign({
      count: 36, colors: ['#f6b6c6', '#ffd9e2', '#fff6f8'], shapes: ['petal'],
      speed: 1, size: [6, 13], wind: 0.6, spin: 1, mode: 'fall', alpha: 1,
    }, o);
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, parts = [], bursts = [], running = true, raf = 0, t0 = performance.now();
    function size() {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    new ResizeObserver(size).observe(canvas); size();
    const rise = opt.mode === 'rise';
    function make(initial) {
      return {
        x: rnd(0, W || 400), y: initial ? rnd(0, H || 800) : (rise ? (H || 800) + 30 : -30),
        r: rnd(opt.size[0], opt.size[1]), c: pick(opt.colors), s: pick(opt.shapes),
        a: rnd(0, 6.28), va: rnd(-0.03, 0.03) * opt.spin, vy: rnd(0.45, 1.3) * opt.speed * (rise ? -1 : 1),
        ph: rnd(0, 6.28), sw: rnd(0.4, 1.2),
      };
    }
    for (let i = 0; i < opt.count; i++) parts.push(make(true));
    function shape(p, alpha, time) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = alpha * opt.alpha;
      const r = p.r; ctx.fillStyle = p.c;
      switch (p.s) {
        case 'petal': {
          ctx.scale(Math.cos(time * 0.002 + p.ph) * 0.5 + 0.6, 1);
          ctx.beginPath(); ctx.moveTo(0, -r);
          ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 0.6, r * 0.8, 0, r);
          ctx.bezierCurveTo(-r * 0.6, r * 0.8, -r * 0.9, -r * 0.6, 0, -r); ctx.fill();
          ctx.globalAlpha *= 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7); ctx.stroke(); break;
        }
        case 'leaf': {
          ctx.scale(Math.cos(time * 0.002 + p.ph) * 0.5 + 0.6, 1);
          ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.8, 0, 0, r); ctx.quadraticCurveTo(-r * 0.8, 0, 0, -r); ctx.fill(); break;
        }
        case 'heart': {
          ctx.beginPath(); ctx.moveTo(0, r * 0.75);
          ctx.bezierCurveTo(-r * 1.2, -r * 0.1, -r * 0.55, -r * 1.05, 0, -r * 0.4);
          ctx.bezierCurveTo(r * 0.55, -r * 1.05, r * 1.2, -r * 0.1, 0, r * 0.75); ctx.fill(); break;
        }
        case 'glitter': {
          ctx.globalAlpha *= 0.5 + 0.5 * Math.sin(time * 0.006 + p.ph); const k = r * 0.5;
          ctx.beginPath(); ctx.moveTo(0, -k); ctx.quadraticCurveTo(0, 0, k, 0); ctx.quadraticCurveTo(0, 0, 0, k);
          ctx.quadraticCurveTo(0, 0, -k, 0); ctx.quadraticCurveTo(0, 0, 0, -k); ctx.fill(); break;
        }
        case 'confetti': {
          ctx.scale(1, Math.cos(time * 0.006 + p.ph)); ctx.fillRect(-r / 2, -r / 5, r, r / 2.5); break;
        }
        case 'marigold': {
          for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.arc(r * 0.55, 0, r * 0.38, 0, 6.28);
            ctx.fillStyle = i % 2 ? p.c : '#f39c12'; ctx.fill();
          }
          ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, 6.28); ctx.fillStyle = '#c0620a'; ctx.fill(); break;
        }
        case 'lantern': {
          ctx.rotate(-p.a); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.4);
          g.addColorStop(0, 'rgba(255,190,90,.55)'); g.addColorStop(1, 'rgba(255,150,60,0)');
          ctx.fillStyle = g; ctx.fillRect(-r * 2.4, -r * 2.4, r * 4.8, r * 4.8);
          ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r); ctx.lineTo(r * 0.6, -r);
          ctx.lineTo(r * 0.45, r); ctx.lineTo(-r * 0.45, r); ctx.closePath(); ctx.fill(); break;
        }
        default: { ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, 6.28); ctx.fill(); }
      }
      ctx.restore();
    }
    // Frames run only while something moves: ambient particles (not under reduced motion) or a burst in flight.
    const busy = () => bursts.length || (parts.length && !reduced);
    const wake = () => { if (!raf && running && !document.hidden && busy()) raf = requestAnimationFrame(frame); };
    function frame(now) {
      raf = 0;
      if (!running) return;
      const time = now - t0;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y += p.vy; p.x += Math.sin(time * 0.001 * p.sw + p.ph) * opt.wind * 0.6; p.a += p.va;
        if ((!rise && p.y > H + 30) || (rise && p.y < -40)) Object.assign(p, make(false));
        shape(p, 1, time);
      }
      for (let i = bursts.length - 1; i >= 0; i--) {
        const p = bursts[i];
        p.vy += 0.18; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.a += p.va; p.life -= 0.007;
        if (p.life <= 0 || p.y > H + 40) bursts.splice(i, 1); else shape(p, Math.min(1, p.life * 2), time);
      }
      wake();
    }
    wake();
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf); raf = 0; wake();
    });
    return {
      burst(x = W / 2, y = H / 2, n = 80, colors = opt.colors, shapes = ['confetti', 'heart', 'glitter']) {
        for (let i = 0; i < n; i++) {
          const ang = rnd(0, 6.28), sp = rnd(3, 11);
          bursts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 4, r: rnd(5, 11), c: pick(colors), s: pick(shapes), a: rnd(0, 6), va: rnd(-0.2, 0.2), ph: rnd(0, 6), life: 1 });
        }
        running = true; wake();
      },
      /* A burst from the middle of el (dy: how far down it, 0–1), in this canvas's coordinates. */
      burstAt(el, n, colors, shapes, dy = 0.5) {
        const r = el.getBoundingClientRect(), c = canvas.getBoundingClientRect();
        this.burst(r.left - c.left + r.width / 2, r.top - c.top + r.height * dy, n, colors, shapes);
      },
      setCount(n) { while (parts.length < n) parts.push(make(false)); parts.length = n; wake(); },
      stop() { running = false; cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, W, H); },
      start() { running = true; wake(); },
    };
  }

  /* Adds .is-in to [data-reveal] when scrolled into view. Variants: up (default) fade zoom left right blur.
     Per-element delay: style="--d:.2s". */
  function reveal(root = document) {
    const els = [...root.querySelectorAll('[data-reveal]:not(.is-in)')];
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
    pauseOffscreen();
  }

  /* Endless CSS animations that run on the main thread (a shine's background-position, a swing on an SVG part) in a
     section the guest has scrolled away from are paused, so they stop restyling every frame; they carry on when it
     is back in view. Transform and opacity animations on HTML elements are left alone: the compositor runs those
     for free, and a paused animation in the page costs Chrome a style pass every frame. Only animations paused here
     are resumed, so a design's own paused states stay paused. Runs once, on the page's top-level sections. */
  let pausing = false;
  const CHEAP = /^(transform|opacity|translate|rotate|scale|offset|easing|composite|computedOffset)$/;
  const heavy = a => a.effect.target instanceof SVGElement && !(a.effect.target instanceof SVGSVGElement)
    || a.effect.getKeyframes().some(k => Object.keys(k).some(p => !CHEAP.test(p)));
  function pauseOffscreen() {
    if (pausing || !document.getAnimations) return;
    pausing = true;
    const SEC = 'section, header, footer', held = new WeakSet();
    const endless = el => el.getAnimations({ subtree: true }).filter(a => a.effect && a.effect.getTiming().iterations === Infinity && heavy(a));
    // A fixed or sticky part stays on screen while its section scrolls away, so it keeps moving.
    const pinned = (el, sec) => { for (let n = el; n && n !== sec; n = n.parentElement) if (/fixed|sticky/.test(getComputedStyle(n).position)) return true; return false; };
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) endless(e.target).forEach(a => { if (held.has(a)) { held.delete(a); a.play(); } });
      else endless(e.target).forEach(a => { if (a.playState === 'running' && !pinned(a.effect.target, e.target)) { held.add(a); a.pause(); } });
    }), { rootMargin: '25% 0px' });
    document.querySelectorAll(SEC).forEach(el => { if (!el.parentElement.closest(SEC)) io.observe(el); });
  }
  const css = document.createElement('style');
  css.textContent = `
    [data-reveal]{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.2,.7,.2,1) var(--d,0s),transform 1s cubic-bezier(.2,.7,.2,1) var(--d,0s),filter 1s ease var(--d,0s)}
    [data-reveal="fade"]{transform:none}
    [data-reveal="zoom"]{transform:scale(.88)}
    [data-reveal="left"]{transform:translateX(-36px)}
    [data-reveal="right"]{transform:translateX(36px)}
    [data-reveal="blur"]{transform:translateY(12px);filter:blur(10px)}
    [data-reveal].is-in{opacity:1;transform:none;filter:none}
    .w-split .w{display:inline-block;opacity:.12;transition:opacity .5s ease calc(var(--i)*45ms),transform .6s ease calc(var(--i)*45ms);transform:translateY(.15em)}
    .w-split.is-in .w{opacity:1;transform:none}
    @media (prefers-reduced-motion: reduce){[data-reveal],.w-split .w{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}}`;
  document.head.appendChild(css);

  /* Wraps each word in span.w (with --i) so .w-split.is-in can stagger them. The text holds the hosts' names,
     so it is rebuilt as DOM nodes: the words must never be parsed as HTML. */
  function splitWords(el) {
    el.classList.add('w-split');
    const spans = el.textContent.trim().split(/\s+/).map((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.style.setProperty('--i', i);
      s.textContent = w;
      return s;
    });
    el.replaceChildren(...spans.flatMap((s, i) => (i ? [' ', s] : [s])));
    return el;
  }

  /* Original synthesized loop (no audio files). timbre: musicbox | harp | santoor | piano. drone adds a soft tanpura. */
  const synth = (() => {
    const MEL = [
      78, 81, 86, 81, 78, 0, 76, 78, 83, 81, 78, 74, 71, 0, 74, 78,
      79, 83, 86, 83, 79, 0, 78, 76, 76, 81, 85, 81, 76, 78, 76, 73,
      74, 78, 81, 86, 85, 81, 78, 81, 83, 0, 86, 83, 78, 0, 81, 83,
      79, 78, 76, 74, 76, 79, 83, 81, 78, 76, 73, 76, 74, 0, 0, 0,
    ];
    const BASS = [50, 47, 43, 45, 50, 47, 43, 45];
    let ac, out, wet, timer, step = 0, nextT = 0, playing = false, timbre = 'musicbox', drone = false, bpm = 76;
    const subs = new Set();
    const hz = m => 440 * 2 ** ((m - 69) / 12);
    function init() {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      out = ac.createGain(); out.gain.value = 0; out.connect(ac.destination);
      const verb = ac.createConvolver(), len = ac.sampleRate * 2.6, buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; }
      verb.buffer = buf; wet = ac.createGain(); wet.gain.value = 0.32; verb.connect(wet); wet.connect(out);
      out.verb = verb;
    }
    function tone(f, t, { type = 'sine', gain = 0.16, decay = 1.4, attack = 0.004, detune = 0 }) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f; o.detune.value = detune;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g); g.connect(out); g.connect(out.verb); o.start(t); o.stop(t + decay + 0.05);
    }
    function voice(m, t) {
      const f = hz(m);
      if (timbre === 'musicbox') { tone(f, t, { gain: 0.15, decay: 1.6 }); tone(f * 4.01, t, { gain: 0.03, decay: 0.35 }); }
      else if (timbre === 'harp') { tone(f, t, { type: 'triangle', gain: 0.13, decay: 2 }); tone(f * 2, t, { gain: 0.03, decay: 0.8 }); }
      else if (timbre === 'santoor') { tone(f, t, { type: 'triangle', gain: 0.09, decay: 1.1, detune: -7 }); tone(f, t, { type: 'triangle', gain: 0.09, decay: 1.1, detune: 7 }); tone(f * 3, t, { gain: 0.02, decay: 0.3 }); }
      else { tone(f, t, { gain: 0.12, decay: 1.8 }); tone(f * 2, t, { type: 'triangle', gain: 0.03, decay: 0.9 }); }
    }
    function sched() {
      const spb = 60 / bpm / 2;
      while (nextT < ac.currentTime + 0.25) {
        const m = MEL[step % MEL.length]; if (m) voice(m, nextT);
        const bar = (step / 8 | 0) % BASS.length;
        if (step % 8 === 0) tone(hz(BASS[bar]), nextT, { type: 'triangle', gain: 0.07, decay: 2.4 });
        if (step % 8 === 4) tone(hz(BASS[bar] + 7), nextT, { type: 'triangle', gain: 0.05, decay: 1.8 });
        if (drone && step % 4 === 0) {
          const seq = [45, 50, 50, 38]; tone(hz(seq[(step / 4) % 4]), nextT, { type: 'sawtooth', gain: 0.018, decay: 3.2, attack: 0.02 });
        }
        nextT += spb; step++;
      }
    }
    const emit = () => subs.forEach(f => f(playing));
    return {
      get playing() { return playing; },
      set(o = {}) { if (o.timbre) timbre = o.timbre; if ('drone' in o) drone = o.drone; if (o.bpm) bpm = o.bpm; return this; },
      play() {
        try {
          if (!ac) init(); ac.resume();
          out.gain.cancelScheduledValues(ac.currentTime); out.gain.linearRampToValueAtTime(0.55, ac.currentTime + 1.2);
          if (!playing) { nextT = ac.currentTime + 0.06; timer = setInterval(sched, 60); }
          playing = true; emit();
        } catch (e) { playing = false; emit(); }
      },
      stop() {
        if (!ac) return; out.gain.cancelScheduledValues(ac.currentTime);
        out.gain.linearRampToValueAtTime(0, ac.currentTime + 0.5); clearInterval(timer); playing = false; emit();
      },
      toggle() { playing ? this.stop() : this.play(); },
      onChange(fn) { subs.add(fn); fn(playing); },
    };
  })();

  /* A YouTube song, played through YouTube's own player (privacy-enhanced domain) from song.start to song.end seconds.
     The player is created on the first play() (the guest's tap), so nothing loads from YouTube before that.
     It sits in a small visible card (.yt-card) while playing, as YouTube's embedding rules expect. */
  function youtube(song, fallback) {
    let player = null, ready = false, playing = false, pending = false, card = null, failed = false;
    const subs = new Set(), emit = () => subs.forEach(f => f(playing));
    // The embed is refused or YouTube's script can't load: play the built-in tune instead of silence.
    const fail = () => { playing = false; failed = true; card && card.remove(); fallback.onChange(on => { playing = on; emit(); }); fallback.play(); };
    const opts = { videoId: song.youtube, start: Math.max(0, song.start | 0), end: song.end > song.start ? song.end | 0 : undefined };
    function load() {
      card = document.createElement('div'); card.className = 'yt-card'; card.setAttribute('aria-label', 'Now playing: ' + (song.title || 'song'));
      card.innerHTML = '<div id="yt-slot"></div>'; document.body.appendChild(card);
      const make = () => {
        player = new YT.Player('yt-slot', {
          host: 'https://www.youtube-nocookie.com', width: 160, height: 90, videoId: opts.videoId,
          playerVars: { start: opts.start, end: opts.end, playsinline: 1, controls: 0, rel: 0, modestbranding: 1, loop: 0 },
          events: {
            onReady: () => { ready = true; if (pending) { player.playVideo(); pending = false; } },
            onStateChange: ev => {
              if (ev.data === YT.PlayerState.ENDED) { player.seekTo(opts.start, true); player.playVideo(); }
              playing = ev.data === YT.PlayerState.PLAYING || ev.data === YT.PlayerState.BUFFERING;
              card.classList.toggle('on', playing); emit();
            },
            // 101/150: the owner blocks embedding; 100: removed.
            onError: fail,
          },
        });
      };
      if (window.YT && YT.Player) make();
      else {
        window.onYouTubeIframeAPIReady = make;
        const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = fail; document.head.appendChild(s);
      }
    }
    return {
      get playing() { return playing; },
      set() { return this; },
      // `card` is set as soon as loading starts: a second play() while YouTube's script loads must not load it again
      play() { if (failed) fallback.play(); else if (!player) { pending = true; if (!card) load(); } else if (ready) player.playVideo(); else pending = true; },
      stop() { if (failed) fallback.stop(); else if (player && ready) player.pauseVideo(); pending = false; },
      toggle() { playing || pending ? this.stop() : this.play(); },
      onChange(fn) { subs.add(fn); fn(playing); },
    };
  }

  /* song.mode: 'youtube' (with song.youtube), 'none', or the built-in tune (song.timbre). */
  const song = WEDDING.song;
  const music = song.mode === 'youtube' && /^[\w-]{11}$/.test(song.youtube || '') ? youtube(song, synth)
    : song.mode === 'none' ? { playing: false, set() { return this; }, play() {}, stop() {}, toggle() {}, onChange() {}, off: true }
    : synth;
  if (music === synth && song.timbre) synth.set({ timbre: song.timbre });
  // The song pauses while the guest is in another app or tab, and carries on when they come back.
  let resumeOnShow = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { resumeOnShow = music.playing; if (resumeOnShow) music.stop(); }
    else if (resumeOnShow) { resumeOnShow = false; music.play(); }
  });
  // The song starts with the guest's first tap, key or scroll on any design. It runs after the design's own handlers,
  // so a first tap on the music button (which starts it) isn't undone. Browsers only let a page play sound after a
  // tap or key, not a scroll alone: a scroll tries only when navigator.userActivation says a tap came first.
  if (!music.off) {
    const events = ['click', 'keydown', 'touchend', 'scroll'];
    const kick = e => setTimeout(() => {
      const may = navigator.userActivation ? navigator.userActivation.isActive : e.type === 'click' || e.type === 'keydown';
      if (!may) return;
      events.forEach(t => removeEventListener(t, kick, true));
      if (!music.playing) music.play();
    });
    events.forEach(t => addEventListener(t, kick, { capture: true, passive: true }));
  }

  /* W.song: the player API the Wedding project's pages 26–33 were written against, over W.music (the host's YouTube
     song, the built-in tune, or off). play() must run inside a guest's tap; W.music only ever starts from one, so
     onChange's needsTap is always false. toggle() follows what is actually playing. */
  const songPlayer = {
    info: song, load() {},
    get off() { return !!music.off; }, get playing() { return music.playing; },
    play() { music.play(); }, pause() { music.stop(); },
    toggle() { music.playing ? music.stop() : music.play(); },
    onChange(fn) { music.onChange(p => fn(p, false)); },
  };

  /* RSVP form contract: fields name, phone, guests, attending (radio yes|no), events (checkboxes of event ids), message.
     Live invites save the reply on the server (a cookie lets the guest change it later); if the host chose
     "save and open WhatsApp", the chat opens inside the same tap so phones don't block it. Preview and demo save nothing. */
  function rsvp(form, { onDone } = {}) {
    const key = 'aai-rsvp-' + (CONFIG.inviteId || 'demo');
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved && onDone) onDone({ data: saved, whatsapp: waUrl(rsvpText(saved)), restored: true });
    } catch (e) {}
    let clientId = '';
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(fd); data.events = fd.getAll('events');
      const whatsapp = waUrl(rsvpText(data));
      const openWa = CONFIG.mode === 'live' && CONFIG.rsvpWhatsapp && (WEDDING.rsvp.whatsapp || '').replace(/\D/g, '').length >= 10;
      if (openWa) window.open(whatsapp, '_blank');
      const btn = form.querySelector('[type=submit]');
      if (CONFIG.mode === 'live' && CONFIG.rsvpUrl) {
        btn.disabled = true;
        clientId = clientId || rsvpClientId();
        try {
          const r = await fetch(CONFIG.rsvpUrl, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...data, guests: +data.guests || 1, to: guestName(), client_id: clientId }) });
          // a 422's detail is a list of field errors, not a sentence a guest can read
          if (!r.ok) { const d = (await r.json().catch(() => ({}))).detail; throw new Error(typeof d === 'string' ? d : 'Please check your reply'); }
        } catch (err) {
          btn.disabled = false;
          const msg = form.querySelector('.rsvp-err') || Object.assign(document.createElement('p'), { className: 'rsvp-err' });
          msg.setAttribute('role', 'alert');
          const why = err instanceof TypeError ? 'Could not reach us. Check your internet' : err.message.replace(/\.$/, '');
          msg.textContent = why + '. Please try again.'; btn.before(msg); return;
        }
        btn.disabled = false;
      }
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (err) {}
      onDone && onDone({ data, whatsapp: (WEDDING.rsvp.whatsapp || '').replace(/\D/g, '').length >= 10 ? whatsapp : '', restored: false, demo: CONFIG.mode !== 'live' });
    });
  }
  /* This browser's id for its replies to this invite, made once and kept, so the server can tell a guest changing
     their reply (or a retried send) from a new guest. Without storage (private mode) it lasts for the page.
     The key holds the slug, not the invite id: 'aai-rsvp-<invite id>' already holds the saved reply. */
  function rsvpClientId() {
    const key = 'aai-rsvp-' + (slug || CONFIG.inviteId);
    const make = () => crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '')
      : [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
    try {
      let id = localStorage.getItem(key);
      if (!/^[\w-]{32}$/.test(id || '')) { id = make(); localStorage.setItem(key, id); }
      return id;
    } catch (e) { return make(); }
  }
  function rsvpText(d) {
    const names = (d.events || []).map(id => (event(id) || {}).name).filter(Boolean).join(', ');
    const yes = d.attending !== 'no';
    return `Namaste! RSVP for ${WEDDING.bride.name} & ${WEDDING.groom.name}'s wedding 💛\nName: ${d.name || ''}${d.phone ? `\nPhone: ${d.phone}` : ''}\nAttending: ${yes ? 'Yes!' : 'Sadly, no'}${yes ? `\nGuests: ${d.guests || 1}` : ''}${yes && names ? `\nFunctions: ${names}` : ''}${d.message ? `\nMessage: ${d.message}` : ''}`;
  }

  // W.scratch, W.bakeFilters and W.stampBract come from canvas-art.js, on the designs that load it.
  window.W = {
    data: WEDDING, config: CONFIG, tokens, event, countdown, mapUrl, calUrl, waUrl, particles, reveal, splitWords, music,
    song: songPlayer, rsvp, reduced, pad2, rnd, pick, esc, safeUrl, small, first, tel, waNum, guestName, scrollToEdited,
    fit, refit, evIcon,
  };
})();
