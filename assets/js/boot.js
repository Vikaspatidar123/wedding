// Runs before the invite paints: lock scrolling behind the tap-to-open gate, or skip it (#skip, previews).
(() => {
  let skip = /^#(skip|open)$/.test(location.hash), mode = '';
  try {
    const cfg = JSON.parse(document.getElementById('invite-config').textContent);
    skip = skip || cfg.skipGate; mode = cfg.mode;
  } catch (e) { /* no config */ }
  document.documentElement.classList.add(skip ? 'skip' : 'locked');
  // The demo and the owner's preview show inside the site's phone frames, where a desktop scrollbar would take 15px
  // of a phone's width; phones overlay theirs, so the frames hide it.
  if (mode === 'demo' || mode === 'preview') {
    const s = document.createElement('style');
    s.textContent = 'html,html *{scrollbar-width:none}html::-webkit-scrollbar,html *::-webkit-scrollbar{display:none}';
    document.head.appendChild(s);
  }
})();
