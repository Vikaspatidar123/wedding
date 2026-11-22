/* Canvas and SVG helpers only some designs use, kept out of shared.js so the rest don't download them:
   W.scratch (Rose Haveli's gold medal, the classic engine's card), W.bakeFilters and W.stampBract (Bougainvillea).
   Load it after shared.js. */
(() => {
  const { rnd } = W;

  /* Scratch-to-reveal. paint(ctx, w, h) draws the cover; onReveal fires once past threshold. */
  function scratch(canvas, o = {}) {
    const opt = Object.assign({ brush: 26, threshold: 0.45, paint: null, onReveal() {} }, o);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let w = 0, h = 0, dpr = 1, started = false, done = false, last = null, moves = 0;
    canvas.style.touchAction = 'none';
    function defaultPaint(c, cw, ch) {
      const g = c.createLinearGradient(0, 0, cw, ch);
      g.addColorStop(0, '#c9a24a'); g.addColorStop(0.5, '#f3dc9a'); g.addColorStop(1, '#b8892f');
      c.fillStyle = g; c.fillRect(0, 0, cw, ch);
      for (let i = 0; i < cw * ch / 40; i++) {
        c.fillStyle = `rgba(255,255,255,${rnd(0.1, 0.7)})`; c.fillRect(rnd(0, cw), rnd(0, ch), rnd(0.5, 2), rnd(0.5, 2));
      }
    }
    function setup() {
      const r = canvas.getBoundingClientRect(); if (!r.width) return;
      dpr = Math.min(devicePixelRatio || 1, 2); w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; (opt.paint || defaultPaint)(ctx, w, h);
      done = false; canvas.style.opacity = '';
    }
    new ResizeObserver(() => { if (!started) setup(); }).observe(canvas);
    const pos = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function check() {
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < d.length; i += 64) { total++; if (d[i] < 20) clear++; }
      if (!done && clear / total > opt.threshold) { done = true; opt.onReveal(); }
    }
    canvas.addEventListener('pointerdown', e => { started = true; last = pos(e); canvas.setPointerCapture(e.pointerId); stroke(last); });
    canvas.addEventListener('pointermove', e => { if (!last) return; stroke(pos(e)); });
    const end = () => { last = null; check(); };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    function stroke(p) {
      ctx.globalCompositeOperation = 'destination-out'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = opt.brush;
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x + 0.01, p.y); ctx.stroke(); last = p;
      if (++moves % 8 === 0) check();
    }
    return { reset() { started = false; setup(); }, reveal() { if (!done) { done = true; opt.onReveal(); } } };
  }

  /* Safari/iOS run SVG filters (noise, blur) on the CPU at every repaint, which hangs phones when the filtered
     element sits in an animated scene. Renders every element using one of the named filters once to a bitmap
     and swaps in an <image> that keeps its class, transform, clip and opacity (so CSS animations still apply).
     Anything animated *inside* a baked element freezes, so only list filters used on still artwork. */
  function bakeFilters(ids, root = document) {
    const NS = 'http://www.w3.org/2000/svg', ser = new XMLSerializer(), cache = new Map();
    const filterOf = el => document.getElementById((el.getAttribute('filter') || '').replace(/^url\(#|\)$/g, ''));
    const targets = [...root.querySelectorAll('[filter^="url(#"]')].filter(el => ids.includes(filterOf(el)?.id));
    if (!targets.length) return;
    // Shapes inside a baked element may point at symbols and gradients elsewhere on the page.
    const defs = [...document.querySelectorAll('svg defs, svg symbol')].map(d => ser.serializeToString(d)).join('');
    const frac = (v, d) => v == null ? d : v.trim().endsWith('%') ? parseFloat(v) / 100 : parseFloat(v);
    const probe = document.createElementNS(NS, 'svg');
    probe.setAttribute('style', 'position:absolute;left:-9999px;width:10px;height:10px;visibility:hidden');
    document.body.appendChild(probe);
    for (const el of targets) {
      const filt = filterOf(el), shape = el.cloneNode(true);
      ['filter', 'opacity', 'transform', 'class', 'style', 'id', 'clip-path', 'mask'].forEach(a => shape.removeAttribute(a));
      probe.appendChild(shape); const bb = shape.getBBox(); probe.removeChild(shape);
      // The filter region (default -10%/120% of the bounding box) is what the filter actually paints into.
      const fx = frac(filt.getAttribute('x'), -0.1), fy = frac(filt.getAttribute('y'), -0.1);
      const b = { x: bb.x + fx * bb.width, y: bb.y + fy * bb.height, width: frac(filt.getAttribute('width'), 1.2) * bb.width, height: frac(filt.getAttribute('height'), 1.2) * bb.height };
      const img = document.createElementNS(NS, 'image');
      for (const a of ['opacity', 'transform', 'class', 'style', 'id', 'clip-path', 'mask']) if (el.hasAttribute(a)) img.setAttribute(a, el.getAttribute(a));
      Object.entries({ x: b.x, y: b.y, width: b.width, height: b.height, preserveAspectRatio: 'none' }).forEach(([k, v]) => img.setAttribute(k, v));
      el.replaceWith(img);
      if (!b.width || !b.height) continue;
      const key = filt.id + ser.serializeToString(shape);
      if (!cache.has(key)) {
        // ponytail: ~1.6 px per SVG unit, capped at 3 MP per texture; raise if the grain looks soft on big screens
        const s = Math.min(Math.min(devicePixelRatio || 1, 2) * 0.8, Math.sqrt(3e6 / (b.width * b.height)));
        const w = Math.max(1, Math.round(b.width * s)), h = Math.max(1, Math.round(b.height * s));
        shape.setAttribute('filter', `url(#${filt.id})`);
        const svg = `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}" preserveAspectRatio="none">${defs}${ser.serializeToString(shape)}</svg>`;
        const src = new Image();
        cache.set(key, new Promise(res => {
          src.onload = () => {
            try {
              const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
              cv.getContext('2d').drawImage(src, 0, 0, w, h);
              cv.toBlob(bl => res(bl ? URL.createObjectURL(bl) : ''));
            } catch (e) { res(''); }
          };
          src.onerror = () => res('');
          src.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        }));
      }
      cache.get(key).then(url => {
        if (!url) return;
        img.setAttribute('href', url);
        // Safari does not refresh <use> copies when something inside the referenced element changes.
        for (let p = img.parentElement; p; p = p.parentElement) {
          if (p.id) document.querySelectorAll(`use[href="#${p.id}"]`).forEach(u => u.setAttribute('href', `#${p.id}`));
        }
      });
    }
    probe.remove();
  }

  /* Bougainvillea bract cluster ('f'), leaf ('l') and fallen petal ('g'), each drawn once per colour into a small
     bitmap. Stamping bitmaps is far cheaper than re-tracing ~1000 vector shapes every frame, which overheated phones. */
  const SPR = 17, SPR_RES = 3, sprites = new Map();
  const bractPath = c => { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-6.5, -2.5, -5.5, -10, 0, -11); c.bezierCurveTo(5.5, -10, 6.5, -2.5, 0, 0); };
  function bractSprite(k, color, hl) {
    const key = k + color + (hl ? 1 : 0);
    if (sprites.has(key)) return sprites.get(key);
    const cv = document.createElement('canvas'); cv.width = cv.height = 2 * SPR * SPR_RES;
    const c = cv.getContext('2d'); c.setTransform(SPR_RES, 0, 0, SPR_RES, SPR * SPR_RES, SPR * SPR_RES); c.lineCap = 'round';
    if (k === 'l') {
      c.fillStyle = color; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6.5, -6, 0, -16); c.quadraticCurveTo(-6.5, -6, 0, 0); c.fill();
      c.strokeStyle = 'rgba(210,240,190,.28)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -1); c.lineTo(0, -14); c.stroke();
    } else if (k === 'g') {
      c.fillStyle = color; bractPath(c); c.fill();
    } else {
      c.fillStyle = color;
      for (let i = 0; i < 3; i++) { c.rotate(2.0944); bractPath(c); c.fill(); }
      if (hl) { c.fillStyle = 'rgba(255,225,215,.22)'; c.rotate(0.4); c.beginPath(); c.ellipse(0, -6.5, 2.2, 3.4, 0, 0, 6.29); c.fill(); c.rotate(-0.4); }
      c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 0.7; c.beginPath();
      for (let i = 0; i < 3; i++) { c.rotate(2.0944); c.moveTo(0, -1); c.lineTo(0, -8.5); } c.stroke();
      c.fillStyle = '#fff3d1'; c.beginPath(); c.arc(0, 0, 1.5, 0, 6.29); c.fill();
    }
    sprites.set(key, cv);
    return cv;
  }
  /* Stamps element e of a bougainvillea set at (x, y) with rotation rot and scale sc, in set units;
     K, OX, OY map set units to canvas pixels. Leaves globalAlpha and the transform changed. */
  function stampBract(ctx, e, x, y, rot, sc, K, OX, OY) {
    const cs = Math.cos(rot) * sc * K, sn = Math.sin(rot) * sc * K, sq = e.k === 'g' ? 0.55 : 1;
    ctx.setTransform(cs, sn, -sn * sq, cs * sq, K * x + OX, K * y + OY);
    ctx.globalAlpha = e.k === 'g' ? 0.85 : 1;
    ctx.drawImage(bractSprite(e.k, e.c, e.hl), -SPR, -SPR, 2 * SPR, 2 * SPR);
  }

  Object.assign(W, { scratch, bakeFilters, stampBract });
})();
