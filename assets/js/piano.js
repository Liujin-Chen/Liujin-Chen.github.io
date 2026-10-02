/* piano.js — Web Audio piano synth + keyboard behaviour for [data-piano] groups.
   Never autoplays: the AudioContext is created/resumed inside the user's gesture
   (mouse/pen: pointerdown · touch: pointerup · keyboard: click). */
(function (LC) {
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, master = null, voices = [], MAXV = 8;
  var enabled = LC.ls.get('lc-sound') !== 'off';
  var KEYMAP = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72 };

  function ensure() {
    if (!AC) return null;
    try {
      if (!ctx) {
        ctx = new AC();
        var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
        master = ctx.createGain(); master.gain.value = 0.5; master.connect(comp); comp.connect(ctx.destination);
      }
      if (ctx.state !== 'running') { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); }
    } catch (e) { ctx = null; }
    return ctx;
  }
  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function play(midi, vel) {
    LC.emit('note', { midi: midi, sound: enabled });
    if (!enabled) return false;
    var c = ensure(); if (!c) return false;
    try {
      var t = c.currentTime, f = freq(midi), v = vel || 0.9;
      var g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(Math.min(9000, f * 8), t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 1.5), t + 1.2);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v * 0.9, t + 0.004);
      g.gain.exponentialRampToValueAtTime(v * 0.25, t + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 2.4);
      g.connect(lp); lp.connect(master);
      var voice = { g: g, oscs: [] };
      [['triangle', 1, 1, 0], ['sine', 2, 0.35, 2], ['sine', 3, 0.12, -3], ['sine', 1, 0.5, 4]].forEach(function (p) {
        var o = c.createOscillator(), og = c.createGain();
        o.type = p[0]; o.frequency.value = f * p[1]; o.detune.value = p[3]; og.gain.value = p[2];
        o.connect(og); og.connect(g); o.start(t); o.stop(t + 2.5); voice.oscs.push(o);
      });
      voice.oscs[0].onended = function () {
        var i = voices.indexOf(voice); if (i > -1) voices.splice(i, 1);
        try { g.disconnect(); lp.disconnect(); } catch (e) {}
      };
      voices.push(voice);
      while (voices.length > MAXV) {
        var old = voices.shift();
        try { old.g.gain.cancelScheduledValues(t); old.g.gain.setTargetAtTime(0, t, 0.03); } catch (e) {}
      }
      return true;
    } catch (e) { return false; }
  }

  function bind(group) {
    var keys = LC.qa('[data-midi]', group), lastPointer = 0, downAt = {};
    var focusables = keys.filter(function (k) { return k.tagName !== 'A'; }).sort(function (a, b) { return +a.dataset.midi - +b.dataset.midi; });
    var struck = null;
    focusables.forEach(function (k, i) { k.setAttribute('tabindex', i === 0 ? '0' : '-1'); });
    function flash(k) { k.classList.add('down'); setTimeout(function () { k.classList.remove('down'); }, 180); }
    function strike(k, x, y) {
      flash(k); lastPointer = performance.now(); struck = k;
      var ok = play(+k.dataset.midi);
      if (LC.dust && x != null) LC.dust.burst(x, y, k.classList.contains('pkey') ? 14 : 8);
      return ok;
    }
    group.addEventListener('pointerdown', function (e) {
      var k = e.target.closest('[data-midi]'); if (!k || e.button !== 0 || k.tagName === 'A') return;
      if (e.pointerType === 'touch') { downAt[e.pointerId] = [e.clientX, e.clientY]; return; }
      strike(k, e.clientX, e.clientY);
    });
    group.addEventListener('pointerup', function (e) {
      var k = e.target.closest('[data-midi]'); if (!k || k.tagName === 'A' || e.pointerType !== 'touch') return;
      var s = downAt[e.pointerId]; delete downAt[e.pointerId];
      if (s && Math.hypot(e.clientX - s[0], e.clientY - s[1]) > 12) return;   /* that was a scroll */
      strike(k, e.clientX, e.clientY);
    });
    group.addEventListener('click', function (e) {
      var k = e.target.closest('[data-midi]'); if (!k) return;
      if (k.tagName === 'A') {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   /* native new-tab etc. */
        e.preventDefault();
        var ok = strike(k, e.clientX || null, e.clientY || null), href = k.href;
        setTimeout(function () { location.href = href; }, ok ? 160 : 0);
        return;
      }
      if (struck === k && performance.now() - lastPointer < 1500) { struck = null; return; }   /* the pointer already played this key */
      var r = k.getBoundingClientRect(); strike(k, r.left + r.width / 2, r.top + r.height / 2);   /* keyboard activation */
    });
    group.addEventListener('keydown', function (e) {
      var k = e.target.closest('[data-midi]');
      if (k && k.tagName !== 'A' && /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End)$/.test(e.key)) {
        e.preventDefault();
        var i = focusables.indexOf(k), n = focusables.length, fwd = /Right|Down/.test(e.key);
        var j = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (i + (fwd ? 1 : -1) + n) % n;
        focusables.forEach(function (f, idx) { f.setAttribute('tabindex', idx === j ? '0' : '-1'); });
        focusables[j].focus(); return;
      }
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      var m = KEYMAP[(e.key || '').toLowerCase()]; if (!m) return;
      var target = keys.filter(function (x) { return +x.dataset.midi === m; })[0]; if (!target) return;
      e.preventDefault(); var r = target.getBoundingClientRect(); strike(target, r.left + r.width / 2, r.top + r.height / 2);
    });
  }

  function bindToggles() {
    LC.qa('[data-sound-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', 'Sound');
      var lbl = LC.q('[data-sound-label]', b); if (lbl) lbl.setAttribute('aria-hidden', 'true');
      function render() {
        b.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        b.classList.toggle('is-off', !enabled);
        var l = LC.q('[data-sound-label]', b); if (l) l.textContent = enabled ? 'sound on' : 'sound off';
      }
      render();
      b.addEventListener('click', function () {
        enabled = !enabled; LC.ls.set('lc-sound', enabled ? 'on' : 'off'); render();
        if (enabled) { ensure(); play(72, 0.5); }
      });
    });
  }

  function init() {
    LC.qa('[data-piano]').forEach(bind);
    bindToggles();
    document.addEventListener('visibilitychange', function () {
      if (!ctx) return;
      try { if (document.hidden && ctx.state === 'running') ctx.suspend(); } catch (e) {}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  LC.piano = { play: play, enabled: function () { return enabled; } };
})(window.LC);
