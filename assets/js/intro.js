/* intro.js — "chalk handwriting" entrance. Runs only when the inline head script added html.intro-pending
   (first visit this session, motion allowed, no ?intro=done|off). Everything it hides is also revealed by a
   CSS safety animation and by the head script's own 5 s timeout, so text can never stay hidden. */
(function (LC) {
  var h = document.documentElement;
  if (!h.classList.contains('intro-pending')) return;
  LC.ss.set('lc-intro', '1');   /* set at the START so a mid-intro reload does not replay */
  var finished = false, timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function finish() {
    if (finished) return; finished = true; timers.forEach(clearTimeout);
    var name = LC.q('.name'); if (name && name.dataset.text) { name.textContent = name.dataset.text; name.removeAttribute('aria-label'); }
    var kick = LC.q('.kicker .kt') || LC.q('.kicker'); if (kick && kick.dataset.text) { kick.textContent = kick.dataset.text; }
    h.classList.remove('intro-pending'); h.classList.add('intro-done');
    LC.emit('intro:done');
  }
  var safety = setTimeout(finish, 5000);
  function split(el, cls) {   /* split text into per-glyph spans; returns the spans */
    var text = el.textContent; el.dataset.text = text; el.classList.add('split');
    if (el.tagName === 'H1') el.setAttribute('aria-label', text);   /* the heading keeps its full name while the glyphs (aria-hidden) write */
    var frag = document.createDocumentFragment(), spans = [];
    text.split(' ').forEach(function (word, wi, words) {
      var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(word, function (ch) { var g = document.createElement('span'); g.className = cls; g.textContent = ch; w.appendChild(g); spans.push(g); });
      frag.appendChild(w);
      if (wi < words.length - 1) { var sp = document.createElement('span'); sp.className = cls + ' sp'; sp.setAttribute('aria-hidden', 'true'); sp.textContent = ' '; frag.appendChild(sp); spans.push(sp); }
    });
    el.textContent = ''; el.appendChild(frag); return spans;
  }
  function run() {
    if (finished) return;
    h.classList.add('intro-run');
    var name = LC.q('.name'), kick = LC.q('.kicker .kt') || LC.q('.kicker'), uline = LC.q('.uline'), fades = LC.qa('.fade'), staff = LC.q('.staff'), nib = LC.q('.nib');
    var t = 0;
    if (kick) { var ks = split(kick, 'k'); ks.forEach(function (s, i) { later(function () { s.classList.add('on'); }, 250 + i * 9); }); t = 250 + ks.length * 9; }
    var nameEnd = Math.max(650, t - 150);
    if (name) {
      var gs = split(name, 'g'); name.style.fontKerning = 'none';
      gs.forEach(function (g, i) {
        later(function () {
          g.classList.add('on');
          var r = g.getBoundingClientRect();
          if (nib) { nib.style.left = (r.right - 4) + 'px'; nib.style.top = (r.bottom - 10) + 'px'; nib.classList.add('on'); }
          if (LC.dust && !g.classList.contains('sp')) LC.dust.burst(r.right - 2, r.bottom - 6, 3);
        }, nameEnd + i * 65);
      });
      nameEnd += gs.length * 65 + 100;
    }
    later(function () { if (nib) nib.classList.remove('on'); if (uline) { uline.classList.add('in'); var r = uline.getBoundingClientRect(); if (LC.dust) { for (var i = 0; i < 6; i++) later(function () { LC.dust.burst(r.left + Math.random() * r.width, r.bottom - 4, 2); }, i * 80); } } }, nameEnd);
    later(function () { fades.forEach(function (f, i) { later(function () { f.classList.add('in'); }, i * 90); }); }, nameEnd + 200);
    later(function () { if (staff) staff.classList.add('in'); }, nameEnd + 350);
    later(function () { clearTimeout(safety); finish(); }, nameEnd + 1250);
  }
  var fontsReady = (document.fonts && document.fonts.load)
    ? Promise.race([Promise.all([document.fonts.load('500 1em Fraunces'), document.fonts.load('400 1em Kalam')]), new Promise(function (r) { setTimeout(r, 800); })])
    : Promise.resolve();
  function start() { fontsReady.then(run, run); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.LC);
