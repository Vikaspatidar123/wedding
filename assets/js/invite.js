/* Mandir Sunrise. Carved teak temple doors with brass bells and lotus medallions, shut by a gold coin of the couple's
   initials. A tap swings them open (GSAP, faded without it) on a temple at sunrise; scrolling walks in through its door
   to an arched parchment card that holds the rest. The flow follows Aavjoo's mandir invite. The door, temple and card
   are our own paintings (1024×1536 WebP beside this file; body.html passes their URLs); the coin, arches and
   ornaments are drawn here.

   Everything is built from W.data (the server's content.clean() output), so any field can be empty; host text only
   enters the page through esc() or textContent. */
(() => {
  const D = W.data, CFG = W.config, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ON = Object.assign({ story: true, scratch: true, countdown: true, travel: true, contacts: true, rsvp: true }, D.sections || {});
  const { esc, safeUrl, small, first, tel, waNum } = W, guest = W.guestName();
  const ext = 'target="_blank" rel="noopener"';
  const html = document.documentElement;
  const PETALS = ['#f4b6b8', '#eea3a8', '#f9d3c8', '#e8742a', '#fbe3d6'];
  const GOLD = ['#f7e0a0', '#d4a548', '#fff4cf', '#b9853f'];
  const PARTY = ['#a8573a', '#d4a548', '#f4b6b8', '#e8742a', '#fff4cf'];
  const wed = W.event('wedding') || D.events.find(e => /wedding|vivah|shaadi|pheras|nikah/i.test(e.name)) || D.events[D.events.length - 1];
  const [A, B] = D.side === 'groom' ? [D.groom, D.bride] : [D.bride, D.groom];
  const names = [A.name, B.name].filter(Boolean);
  const couple = names.join(' एवं ') || 'वर-वधू';
  const preview = CFG.mode === 'preview';
  const dt = D.dateText, hasDate = !!(D.date && dt.day);

  /* ---------- drawing helpers ---------- */
  const f1 = n => +n.toFixed(1);
  // A multifoil (scalloped) arch from (x0, ys) over to (x1, ys), its crown at ya: n lobes along a half ellipse.
  function cusp(x0, x1, ys, ya, n) {
    const cx = (x0 + x1) / 2, hw = (x1 - x0) / 2, h = ys - ya;
    let d = `M${x0} ${ys}`, px = x0, py = ys;
    for (let i = 1; i <= n; i++) {
      const t = Math.PI * i / n, x = f1(cx - hw * Math.cos(t)), y = f1(ys - h * Math.sin(t)), r = f1(Math.hypot(x - px, y - py) * .6);
      d += `A${r} ${r} 0 0 1 ${x} ${y}`; px = x; py = y;
    }
    return d;
  }
  const lotus = (x, y, s, fill) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}"><path d="M0 0C-6 -8 -6 -20 0 -28C6 -20 6 -8 0 0Z"/><path d="M0 0C-10 -4 -18 -14 -16 -24C-8 -20 -2 -12 0 0Z"/><path d="M0 0C10 -4 18 -14 16 -24C8 -20 2 -12 0 0Z"/><path d="M0 0C-12 0 -24 -6 -28 -14C-18 -14 -8 -8 0 0Z"/><path d="M0 0C12 0 24 -6 28 -14C18 -14 8 -8 0 0Z"/><rect x="-20" y="0" width="40" height="2.4" rx="1.2"/></g>`;
  const ART = $('#page').dataset;

  /* ---------- the gold coin on the doors ---------- */
  function coin() {
    const t = D.initials || 'VR', beads = [];
    for (let i = 0; i < 36; i++) { const r = i / 36 * Math.PI * 2; beads.push(`<circle cx="${f1(43 * Math.cos(r))}" cy="${f1(43 * Math.sin(r))}" r="1.5"/>`); }
    return `<svg viewBox="-50 -50 100 100" aria-hidden="true"><defs><radialGradient id="cn" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#f9e7ad"/><stop offset=".5" stop-color="#d9aa4c"/><stop offset="1" stop-color="#946a1f"/></radialGradient></defs>
      <circle r="48" fill="url(#cn)" stroke="#7a5418" stroke-width="1"/><g fill="#fff1c4" opacity=".75">${beads.join('')}</g>
      <circle r="38" fill="none" stroke="#7a5418" stroke-width=".9"/><circle r="35" fill="none" stroke="#fff1c4" stroke-width=".6" opacity=".7"/>
      ${t ? `<text y="${t.length > 1 ? 9 : 10}" text-anchor="middle" font-family="'Bodoni Moda', Didot, serif" font-style="italic" font-size="${t.length > 1 ? 26 : 30}" fill="#5b3a0e">${esc(t)}</text>`
        : lotus(0, 10, .8, '#5b3a0e')}
    </svg>`;
  }

  /* ---------- page ---------- */
  const photos = (D.photos && D.photos.gallery || []).filter(safeUrl);
  const cover = safeUrl(D.photos && D.photos.cover) || photos[0] || '';
  const moments = photos.filter(u => u !== cover);
  const archMask = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 330" preserveAspectRatio="none"><path d="${cusp(0, 260, 120, 0, 9)}V330H0Z"/></svg>`)}")`;
  const portrait = cover ? `<div class="portrait" data-reveal="zoom"><div class="ph" style="${esc(`-webkit-mask-image:${archMask};mask-image:${archMask}`)}"><img src="${esc(cover)}" alt="" decoding="async"></div>
      <svg viewBox="-6 -6 272 342" aria-hidden="true"><path d="${cusp(0, 260, 120, 0, 9)}V330H0Z" fill="none" stroke="#b9853f" stroke-width="2"/><path d="${cusp(-5, 265, 121, -5, 9)}V335H-5Z" fill="none" stroke="#b9853f" stroke-width=".7"/></svg></div>`
    : preview ? '<div class="portrait empty" data-reveal="zoom"><p>Your photo here</p></div>' : '';
  const orn = `<svg class="orn" viewBox="0 0 160 20" aria-hidden="true"><path d="M6 10H62M98 10H154" stroke="#b9853f" stroke-width=".8"/><path d="M80 2L88 10L80 18L72 10Z" fill="none" stroke="#b9853f"/><circle cx="80" cy="10" r="2.4" fill="#a8573a"/><circle cx="66" cy="10" r="1.6" fill="#b9853f"/><circle cx="94" cy="10" r="1.6" fill="#b9853f"/></svg>`;
  const head = (kick, title) => `<div class="sh" data-reveal>${kick ? `<p class="kick">${esc(kick)}</p>` : ''}<h2>${esc(title)}</h2>${orn}</div>`;
  const IC = {
    pin: '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
    cal: '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    wa: '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19z"/><path d="M9 8.5c0 3.5 2.6 6.4 6.3 6.6l.9-1.6-2-1-1 .9c-1-.4-2-1.4-2.4-2.4l.9-1-1-2z" fill="currentColor" stroke-width=".8"/></svg>',
    phone: '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    share: '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
    down: '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    diya: '<svg viewBox="0 0 24 24" class="ico" aria-hidden="true"><path d="M3 14h18c-1 4-5 6-9 6s-8-2-9-6zM12 11c-1.5-1.5-1.5-4 0-7 1.5 3 1.5 5.5 0 7z"/></svg>',
  };
  const cap = `<svg class="cap" viewBox="0 0 300 64" preserveAspectRatio="none" aria-hidden="true"><path d="${cusp(1, 299, 64, 4, 9)}" fill="#fdf6ec" stroke="#b9853f" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
  const evCard = (e, i) => {
    const where = e.venue || e.address;
    return `<li class="ev${e === wed ? ' big' : ''}" data-reveal style="--d:${(i % 2) * .08}s">${cap}<div class="ev-ic">${W.evIcon(e)}</div>
    <div class="ev-b">
      <h3>${esc(e.name)}</h3>
      ${e.dateText || e.time ? `<p class="ev-when">${e.date ? `${esc(e.day)} · ${esc(e.short)}` : esc(e.dateText)}${e.time ? `<span>${esc(e.time)}</span>` : ''}</p>` : ''}
      ${where ? `<p class="ev-venue">${esc(where)}${e.venue && e.address ? `<span>${esc(e.address)}</span>` : ''}</p>` : ''}
      ${e.dress ? `<p class="ev-dress">परिधान: ${esc(e.dress)}</p>` : ''}
      ${e.note ? `<p class="ev-note">${esc(e.note)}</p>` : ''}
      ${where || e.map || e.date ? `<div class="ev-links">${where || e.map ? `<a class="pill" href="${esc(W.mapUrl(e))}" ${ext}>${IC.pin}स्थान / मार्ग</a>` : ''}${e.date ? `<a class="pill" href="${esc(W.calUrl(e))}" ${ext}>${IC.cal}कैलेंडर में जोड़ें</a>` : ''}</div>` : ''}
    </div></li>`;
  };
  const person = (p, d) => p.name ? `<div class="pp" data-reveal="bloom" style="--d:${d}s">${p.line ? `<p class="par">${esc(p.line)}</p>` : ''}<p class="nm">${esc(p.full || p.name)}</p></div>` : '';
  const heroDate = hasDate ? `${dt.weekday} · ${dt.day} ${dt.month} ${dt.year}` : '';
  const waReply = CFG.rsvpWhatsapp && (D.rsvp.whatsapp || '').length >= 11;

  $('#page').innerHTML = `
  <div class="paper" aria-hidden="true"><div class="card-art" style="${esc(`border-image-source:url("${ART.card}")`)}"></div></div>
  <div class="paper frame" aria-hidden="true"><div class="card-art" style="${esc(`border-image-source:url("${ART.frame}")`)}"></div></div>

  <section class="walk" id="home" aria-label="Invitation">
    <div class="stage">
      <div class="zoom"><img class="scene" src="${esc(ART.temple)}" alt="A bride and groom walking up a lamp-lit aisle to a temple at sunrise" decoding="async"></div>
      <div class="hero-copy">
        ${D.invocation ? `<p class="invoc" lang="hi" data-reveal="fade">${esc(D.invocation)}</p>` : ''}
        <h1 class="hn" data-reveal style="--d:.2s">${names.length > 1
          ? `<span class="hn-a">${esc(A.name)}</span><span class="weds">संग</span><span class="hn-b">${esc(B.name)}</span>`
          : `<span class="hn-a">${esc(names[0] || 'सादर निमंत्रण')}</span>`}</h1>
        ${heroDate ? `<p class="hd" data-reveal style="--d:.45s">${esc(heroDate)}</p>` : ''}
        ${D.city ? `<p class="hc" data-reveal style="--d:.55s">${esc(D.city)}</p>` : ''}
      </div>
      <button class="cue" type="button" data-reveal="fade" style="--d:1s"><span>प्रवेश करने के लिए नीचे स्क्रॉल करें</span>${IC.down}</button>
    </div>
  </section>

  <section class="invite" id="invite">
    ${portrait}
    ${D.invocationEn ? `<p class="kick" data-reveal="fade">${esc(D.invocationEn)}</p>` : ''}
    ${D.hosts ? `<p class="hosts" data-reveal="bloom">${esc(D.hosts)}</p>` : ''}
    ${D.inviteLine ? `<p class="line" data-reveal="bloom" style="--d:.1s">${esc(D.inviteLine)}</p>` : ''}
    ${D.hosts || D.inviteLine ? orn : ''}
    <h2 class="sr">${names.length > 1 ? `${esc(A.full || A.name)} एवं ${esc(B.full || B.name)}` : esc(names[0] || 'सादर निमंत्रण')}</h2>
    <div class="couple" aria-hidden="true">
      ${person(A, .15)}
      ${names.length > 1 ? '<p class="and" data-reveal="bloom" style="--d:.25s">संग</p>' : ''}
      ${person(B, .35)}
    </div>
    ${D.grandparents ? `<p class="gp" data-reveal="fade">${esc(D.grandparents)}</p>` : ''}
    ${D.shloka ? `<p class="shloka" lang="hi" data-reveal="fade">${esc(D.shloka)}</p>` : ''}
  </section>

  ${hasDate ? `<section class="date" id="date">
    ${head(ON.scratch ? 'मांगलिक संदेश' : 'शुभ दिन', 'शुभ विवाह लग्न एवं तिथि')}
    <div class="sd" data-reveal>
      <div class="sd-in"><p class="lbl">${esc(dt.weekday)}</p><p class="big">${esc(dt.day)}</p><p class="lbl">${esc(dt.month)} · ${esc(dt.year)}</p>${D.city ? `<p class="where">${esc(D.city)}</p>` : ''}</div>
      ${ON.scratch ? '<canvas aria-label="Scratch to reveal the wedding date" role="img"></canvas>' : ''}
    </div>
    ${ON.scratch ? '<button class="linkbtn" type="button" id="revealAll">तिथि देखने के लिए यहाँ टैप करें</button>' : ''}
  </section>` : ''}

  ${ON.countdown && hasDate ? `<section class="cd-wrap" aria-label="शुभ घड़ी की प्रतीक्षा">
    ${head('शुभ घड़ी की प्रतीक्षा', 'विवाह के पावन दिवस तक')}
    <div class="cd" data-reveal role="timer" aria-live="off">
      <div><b id="cd-d">0</b><small>दिन</small></div><div><b id="cd-h">00</b><small>घंटे</small></div>
      <div><b id="cd-m">00</b><small>मिनट</small></div><div><b id="cd-s">00</b><small>सेकंड</small></div>
    </div>
    <p class="cd-note" id="cd-note" data-reveal="fade"></p>
  </section>` : ''}

  ${D.welcome ? `<section class="welcome" id="us">${orn}<p class="msg" id="welcome" data-reveal="fade">${esc(D.welcome)}</p></section>` : ''}

  ${D.events.length ? `<section id="events">
    ${head('मांगलिक उत्सव', D.events.length > 1 ? 'विवाह कार्यक्रम' : 'विवाह कार्यक्रम')}
    <ol class="events">${D.events.map(evCard).join('')}</ol>
  </section>` : ''}

  ${ON.story && D.story.length ? `<section id="story">
    ${head('यादों के झरोखे से', 'हमारी कहानी')}
    <ol class="chaps">${D.story.map(s => `<li data-reveal>${s.year ? `<p class="yr">${esc(s.year)}</p>` : ''}${s.title ? `<h3>${esc(s.title)}</h3>` : ''}${s.text ? `<p>${esc(s.text)}</p>` : ''}${safeUrl(s.photo) ? `<img src="${esc(small(s.photo))}" alt="" loading="lazy" decoding="async">` : ''}</li>`).join('')}</ol>
  </section>` : ''}

  ${moments.length ? `<section id="gallery">
    ${head('सुखद स्मृतियाँ', 'स्नेहिल पल')}
    <div class="gal">${moments.map((u, i) => `<button type="button" data-full="${esc(u)}" aria-label="Open photo ${i + 1} of ${moments.length}" data-reveal style="--r:${[-3, 2.5, -1.5, 3][i % 4]}deg"><img src="${esc(small(u))}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>
    <dialog class="box" id="galBox"><button type="button" class="x" aria-label="Close photo">×</button><img alt=""></dialog>
  </section>` : ''}

  ${ON.travel && D.travel.length ? `<section id="travel">
    ${head('आगमन जानकारी', 'मार्ग एवं आवास')}
    <div class="cards">${D.travel.map((t, i) => `<div class="tc" data-reveal style="--d:${i * .08}s"><div class="i">${IC.pin}</div><div><h3>${esc(t.title)}</h3>${t.text ? `<p>${esc(t.text)}</p>` : ''}</div></div>`).join('')}</div>
  </section>` : ''}

  ${ON.contacts && D.contacts.length ? `<section id="contacts">
    ${head('संपर्क सूत्र', 'पूछताछ एवं सहयोग')}
    <div class="cards">${D.contacts.map((c, i) => `<div class="tc contact" data-reveal style="--d:${i * .08}s"><div class="i">${IC.diya}</div><div class="who"><h3>${esc(c.name)}</h3>${c.role ? `<span class="role">${esc(c.role)}</span>` : ''}${c.phone ? `<span class="ph">${esc(c.phone)}</span>` : ''}</div>
      ${tel(c.phone).length >= 8 ? `<div class="acts"><a href="tel:${esc(tel(c.phone))}" aria-label="Call ${esc(c.name)}">${IC.phone}</a><a href="https://wa.me/${esc(waNum(c.phone))}" ${ext} aria-label="WhatsApp ${esc(c.name)}">${IC.wa}</a></div>` : ''}</div>`).join('')}</div>
  </section>` : ''}

  /* "Will you join us?" (RSVP) section commented out for now:
  ${ON.rsvp ? `<section id="rsvp">
    ${head('RSVP', 'Will you join us?')}
    ${D.rsvp.by ? `<p class="by-top" data-reveal="fade">Kindly reply by ${esc(D.rsvp.by)}</p>` : ''}
    <div class="rsvp-card" data-reveal>
      <form id="rsvpForm" novalidate>
        <fieldset><legend class="sr">Will you join us?</legend><div class="chips two">
          <label class="chip"><input type="radio" name="attending" value="yes" checked><span>Joyfully accept</span></label>
          <label class="chip"><input type="radio" name="attending" value="no"><span>Regretfully decline</span></label>
        </div></fieldset>
        <label class="fld"><span>Your name</span><input name="name" required maxlength="120" autocomplete="name" placeholder="e.g. Sharma family"></label>
        <label class="fld"><span>Phone</span><input name="phone" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="+91"></label>
        <label class="fld" id="guestsF"><span>Number of guests</span><select name="guests">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}"${n === 2 ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
        ${D.events.length ? `<fieldset id="evPick"><legend>Celebrating with us at</legend><div class="chips">${D.events.map(e => `<label class="chip"><input type="checkbox" name="events" value="${esc(e.id)}" checked><span>${esc(e.name)}</span></label>`).join('')}</div></fieldset>` : ''}
        <label class="fld"><span>A note for ${esc(couple)}</span><textarea name="message" rows="2" maxlength="1000" placeholder="Optional"></textarea></label>
        <button class="btn" type="submit">${waReply ? `${IC.wa}Send RSVP on WhatsApp` : 'Send my RSVP'}</button>
      </form>
      <div class="thanks" id="thanks" hidden aria-live="polite">
        <svg class="ty-ic" viewBox="-40 -40 80 80" aria-hidden="true"><circle r="38" fill="#fdf6ec" stroke="#b9853f"/>${lotus(0, 12, .9, '#a8573a')}</svg>
        <p class="ty" id="tyTitle">Thank you</p>
        <p id="tyText"></p>
        <a class="btn" id="tyWa" href="#" ${ext} hidden>${IC.wa}Send on WhatsApp</a>
        <br><button class="linkbtn" type="button" id="tyEdit">Change my reply</button>
      </div>
    </div>
  </section>` : ''}
  */

  <footer data-reveal="fade">
    ${orn}
    <p class="bless">बुजुर्गों के पावन आशीर्वाद एवं स्नेह सहित,</p>
    ${names.length ? `<p class="sig">${esc(names.join(' एवं '))}</p>` : ''}
    ${D.families ? `<p class="fam">${esc(D.families)}</p>` : ''}
    ${D.hashtag ? `<p class="hash">${esc(D.hashtag)}</p>` : ''}
    ${preview ? '' : `<button class="pill" type="button" id="share">${IC.share}निमंत्रण पत्र साझा करें</button>`}
    ${CFG.branding !== false ? `<br><a class="made" href="${esc(CFG.madeWithUrl || 'https://aaiyega.com/')}" ${ext}>Made with Aaiyega</a>` : ''}
  </footer>`;

  if ($('#welcome')) W.splitWords($('#welcome'));
  $('#coin').innerHTML = coin();
  $('#gNames').textContent = names.join(' संग ');
  $('#gNames').hidden = !names.length;
  if (guest) { $('#gTo').textContent = `आदरणीय ${guest},`; $('#gTo').hidden = false; }
  // A long single name can't wrap: shrink it to the column instead of letting it run off the page.
  W.refit(() => W.fit([$('#gNames'), ...$$('.hn span'), ...$$('.nm')], { min: 24 }));

  const fx = W.particles($('#fx'), { count: 0, colors: PETALS, shapes: ['petal'], size: [6, 11], speed: .55, wind: .9, alpha: .85 });

  /* ---------- song pill: W.music is the host's YouTube song, the built-in tune, or off ---------- */
  const S = D.song, snd = $('#snd'), meta = (t, b) => { $('.meta b', snd).textContent = t; $('.meta small', snd).textContent = b; };
  const yt = S.mode === 'youtube' && S.youtube;
  const title = (yt && S.title) || 'मांगलिक धुन', by = (yt && S.by) || 'सुनने के लिए टैप करें';
  if (yt) $('.disc', snd).style.backgroundImage = `url("https://i.ytimg.com/vi/${encodeURIComponent(S.youtube)}/mqdefault.jpg")`;
  meta(title, by);
  let wideT;
  const widen = (ms = 4500) => { snd.classList.add('wide'); clearTimeout(wideT); wideT = setTimeout(() => snd.classList.remove('wide'), ms); };
  if (!W.music.off) {
    let was = false;
    W.music.onChange(on => {
      if (on !== was) widen();
      was = on;
      meta(title, on ? (yt && S.by) || 'धुन बज रही है' : by);
      snd.classList.toggle('on', on); snd.setAttribute('aria-pressed', on); snd.setAttribute('aria-label', `${on ? 'रोकें' : 'बजाएं'} ${title}`);
    });
    snd.addEventListener('click', () => W.music.toggle());
  }

  /* ---------- walking in: the temple grows towards its door as the guest scrolls, and fades into the card ---------- */
  // The card's frame sits in front of the page (text scrolls behind its arch), so it shows only once the temple has gone.
  const walk = $('#home'), stage = $('.stage', walk), zoom = $('.zoom', walk), copy = $('.hero-copy', walk), cue = $('.cue', walk), frame = $('.frame');
  const still = W.reduced;
  if (still) walk.classList.add('still');
  let queued = false;
  const ease = (a, b, p) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  const step = () => {
    queued = false;
    const r = walk.getBoundingClientRect();
    if (still) { frame.style.opacity = ease(.25, 0, r.bottom / innerHeight); return; }
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    // Aim at the temple's doorway (512, 1095 in the 1024×1536 painting), wherever object-fit: cover puts it here.
    const w = stage.clientWidth, h = stage.clientHeight, s = Math.max(w / 1024, h / 1536);
    zoom.style.transformOrigin = `${f1((w - 1024 * s) / 2 + 512 * s)}px ${f1((h - 1536 * s) / 2 + 1095 * s)}px`;
    zoom.style.transform = p ? `scale(${(1 + p * p * 2.6).toFixed(3)})` : '';
    stage.style.opacity = p ? 1 - ease(.55, 1, p) : '';
    frame.style.opacity = ease(.55, 1, p);
    copy.style.opacity = p ? 1 - ease(0, .35, p) : '';
    copy.style.transform = p ? `translateY(${-f1(p * 70)}px)` : '';
    cue.style.visibility = p > .1 ? 'hidden' : '';
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(step); } }, { passive: true });
  step();
  cue.addEventListener('click', () => $('#invite').scrollIntoView({ behavior: W.reduced ? 'auto' : 'smooth' }));

  /* ---------- tap glints ---------- */
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn,.pill,.chip span'); if (!b || W.reduced) return;
    const r = b.getBoundingClientRect(), s = document.createElement('i');
    s.className = 'glint'; s.style.left = e.clientX - r.left + 'px'; s.style.top = e.clientY - r.top + 'px';
    b.appendChild(s); setTimeout(() => s.remove(), 650);
  });

  /* ---------- the doors (the guest's tap also starts the song, in shared.js) ---------- */
  const gate = $('#gate'), coinBtn = $('#coin');
  let opened = false;
  function finish() {
    gate.remove();
    html.classList.remove('locked');
    if (!W.music.off) { snd.hidden = false; requestAnimationFrame(() => { snd.classList.add('show'); widen(); }); }
    fx.setCount(12);
    W.reveal();
    W.scrollToEdited();
  }
  const shower = () => { const w = innerWidth; [.2, .5, .8].forEach((x, i) => setTimeout(() => fx.burst(w * x, -10, 26, PETALS, ['petal']), i * 140)); };
  function openDoors() {
    if (opened) return; opened = true;
    const g = window.gsap;
    gate.classList.remove('idle'); gate.classList.add('ring');
    if (!g || W.reduced) {
      gate.style.transition = 'opacity .7s'; gate.style.opacity = 0;
      if (!W.reduced) shower();
      setTimeout(finish, 700); return;
    }
    g.timeline({ onComplete: finish })
      .to('.plaque,.hint', { opacity: 0, y: -8, duration: .35, ease: 'power2.out' }, 0)
      .to(coinBtn, { scale: 1.12, duration: .16, ease: 'power2.out' }, 0)
      .add(() => fx.burstAt(coinBtn, 30, GOLD, ['glitter']))
      .to(coinBtn, { rotationY: 540, scale: 1.5, opacity: 0, duration: .85, ease: 'power2.in' })
      .addLabel('swing', '-=.3')
      .to('.leaf.l', { rotateY: -108, duration: 1.9, ease: 'power3.inOut' }, 'swing')
      .to('.leaf.r', { rotateY: 108, duration: 1.9, ease: 'power3.inOut' }, 'swing+=.06')
      .to('.leaf .shade', { opacity: .8, duration: 1.1, ease: 'sine.in' }, 'swing')
      .fromTo('.walk .scene', { scale: 1.15 }, { scale: 1, duration: 2.6, ease: 'power2.out', clearProps: 'transform' }, 'swing')
      .add(() => W.reveal(), 'swing+=.3')
      .add(shower, 'swing+=.5')
      .to(gate, { opacity: 0, duration: .5 }, 'swing+=1.5');
  }
  coinBtn.addEventListener('click', openDoors);
  gate.addEventListener('click', e => { if (!coinBtn.contains(e.target)) openDoors(); });
  if (html.classList.contains('skip')) { opened = true; finish(); }

  /* ---------- scratch the date ---------- */
  function goldPaint(c, w, h) {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#ecd096'); g.addColorStop(.5, '#d4a548'); g.addColorStop(1, '#b07e34');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,244,214,.4)'; c.lineWidth = 1;
    c.save(); c.translate(w / 2, h / 2);
    for (let r = 20; r < Math.max(w, h); r += 18) { c.beginPath(); c.arc(0, 0, r, 0, 6.29); c.stroke(); }
    for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.beginPath(); c.ellipse(0, -52, 7, 16, 0, 0, 6.29); c.stroke(); }
    c.restore();
    for (let i = 0; i < w * h / 70; i++) { c.fillStyle = `rgba(255,250,230,${W.rnd(.1, .55)})`; c.fillRect(W.rnd(0, w), W.rnd(0, h), W.rnd(.5, 1.6), W.rnd(.5, 1.6)); }
    c.fillStyle = '#5b2615'; c.font = '15px "Tiro Devanagari Hindi", Marcellus, serif'; c.textAlign = 'center';
    c.fillText('देखने के लिए स्क्रैच करें', w / 2, h / 2 + 5);
  }
  const sc = $('.sd canvas');
  if (sc) {
    const s = W.scratch(sc, {
      brush: 34, threshold: .45, paint: goldPaint,
      onReveal() {
        sc.classList.add('gone'); $('#date').classList.add('done');
        setTimeout(() => fx.burstAt($('.sd'), 70, PARTY, ['petal', 'glitter', 'heart']), 200);
      },
    });
    // Fonts load after first paint; repaint the untouched card so its words are in Marcellus.
    if (document.fonts) document.fonts.ready.then(() => { if (!sc.classList.contains('gone')) s.reset(); });
    $('#revealAll').addEventListener('click', () => s.reveal());
  }

  /* ---------- countdown ---------- */
  if ($('#cd-d')) {
    const cdEls = { d: $('#cd-d'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s') };
    W.countdown(t => {
      for (const k in cdEls) {
        const v = k === 'd' ? String(t[k]) : W.pad2(t[k]);
        if (cdEls[k].textContent !== v) cdEls[k].textContent = v;
      }
      $('#cd-note').textContent = t.done ? 'मांगलिक उत्सव प्रारंभ हो चुका है। आपके स्नेहिल आशीर्वाद के लिए सादर धन्यवाद।'
        : `${heroDate}${D.city ? ` · ${D.city}` : ''}`;
    });
  }

  /* ---------- moments: full size on tap ---------- */
  const box = $('#galBox');
  if (box) $('#gallery').addEventListener('click', e => {
    const b = e.target.closest('[data-full]');
    if (b) { $('img', box).src = b.dataset.full; box.showModal(); } else if (e.target === box || e.target.closest('.x')) box.close();
  });

  /* ---------- share ---------- */
  const share = $('#share');
  if (share) share.addEventListener('click', () => {
    const data = { title: document.title, text: names.length ? `विकास एवं राधा के शुभ विवाह का निमंत्रण पत्र` : 'सादर निमंत्रण', url: location.href.split('#')[0] };
    const label = share.lastChild;  // the text after the icon
    if (navigator.share) navigator.share(data).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(data.url).then(() => { label.textContent = 'लिंक कॉपी हो गया'; setTimeout(() => (label.textContent = 'निमंत्रण पत्र साझा करें'), 1600); }, () => {});
  });

  /* ---------- RSVP (field names are W.rsvp's contract) ---------- */
  const form = $('#rsvpForm');
  if (form) {
    const thanks = $('#thanks'), fEl = k => form.elements.namedItem(k), nameIn = fEl('name');
    form.addEventListener('submit', e => {
      if (!nameIn.value.trim()) { e.preventDefault(); e.stopImmediatePropagation(); nameIn.focus(); nameIn.style.borderColor = '#b4364f'; }
    }, true);
    W.rsvp(form, {
      onDone({ data, whatsapp, restored }) {
        const yes = data.attending !== 'no', who = first(data.name);
        $('#tyTitle').textContent = who ? `Thank you, ${who}` : 'Thank you';
        $('#tyText').textContent = (yes ? 'Your reply is saved. We can’t wait to celebrate with you.' : 'We will miss you, and we are grateful for your blessings.')
          + (whatsapp ? ' If WhatsApp did not open, tap below to send it.' : '')
          + (CFG.mode !== 'live' ? ' (This is a preview, so nothing was sent.)' : '');
        $('#tyWa').hidden = !whatsapp; if (whatsapp) $('#tyWa').href = whatsapp;
        for (const k of ['name', 'phone', 'guests', 'message']) if (data[k] != null && fEl(k)) fEl(k).value = data[k];
        $$('input[name="attending"]', form).forEach(r => (r.checked = r.value === (data.attending || 'yes')));
        $$('input[name="events"]', form).forEach(c => (c.checked = (data.events || []).includes(c.value)));
        form.hidden = true; thanks.hidden = false;
        if (!restored) { fx.burstAt(thanks, 100, PARTY, ['petal', 'heart', 'glitter']); thanks.scrollIntoView({ block: 'center', behavior: W.reduced ? 'auto' : 'smooth' }); }
      },
    });
    $('#tyEdit').addEventListener('click', () => { thanks.hidden = true; form.hidden = false; nameIn.focus(); });
    const sync = () => { const no = form.elements.namedItem('attending').value === 'no'; $('#guestsF').hidden = no; if ($('#evPick')) $('#evPick').style.opacity = no ? .45 : 1; };
    form.addEventListener('change', sync);
    sync();
  }
})();
