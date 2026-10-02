/* ambient.js — floating hand-drawn notes with parallax, staff draw-in, mascot hum and scene reactions.
   Needs a <div class="ambient" aria-hidden="true"></div> in the page; content to avoid carries data-avoid. */
(function (LC) {
  var SYMBOLS = '<svg class="ambient-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    '<symbol id="lc-n1" viewBox="0 0 24 32"><ellipse cx="8.6" cy="26.1" rx="5.3" ry="3.7" transform="rotate(-22 8.6 26.1)" fill="currentColor"/><path d="M12.9 25.2C12.5 18 13.1 10.6 12.6 3.2c3.1 2.1 7.1 4 6.3 9.2-.6-2-2.8-3-6.1-3.3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></symbol>' +
    '<symbol id="lc-n2" viewBox="0 0 34 32"><ellipse cx="7.4" cy="26.3" rx="5.2" ry="3.6" transform="rotate(-20 7.4 26.3)" fill="currentColor"/><ellipse cx="24.6" cy="23.4" rx="5.2" ry="3.6" transform="rotate(-20 24.6 23.4)" fill="currentColor"/><path d="M11.6 25.4c-.3-6.9.2-13.5-.1-20.2M28.8 22.5c-.4-6.6.3-13.1-.2-19.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M11.4 5.6c5.9-1.4 11.5-2.1 17.3-3.1" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></symbol>' +
    '<symbol id="lc-n3" viewBox="0 0 20 32"><ellipse cx="7.8" cy="26.4" rx="5.4" ry="3.8" transform="rotate(-24 7.8 26.4)" fill="currentColor"/><path d="M12.4 25.6c-.4-7.2.3-14.6-.2-21.9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></symbol>' +
    '</defs></svg>';
  var layer = null, placed = false;
  function count() { var w = innerWidth; return w >= 1024 ? 5 : w >= 600 ? 4 : 3; }
  function rects() { return LC.qa('[data-avoid]').map(function (el) { return el.getBoundingClientRect(); }); }
  function build() {
    layer = LC.q('.ambient'); if (!layer || !LC.motionOK() || LC.reduceData()) return;
    if (!LC.q('.ambient-defs')) document.body.insertAdjacentHTML('afterbegin', SYMBOLS);
    layer.innerHTML = '';
    var n = count();
    for (var i = 0; i < n; i++) {
      var span = document.createElement('span'), size = 18 + Math.round(Math.random() * 16), depth = i % 2 ? .7 : .35;
      span.className = 'note'; span.dataset.size = size;
      span.style.setProperty('--depth', depth); span.style.setProperty('--op', (0.14 + Math.random() * 0.08).toFixed(2));
      span.style.setProperty('--dur', (18 + Math.random() * 12).toFixed(1) + 's'); span.style.setProperty('--delay', (-Math.random() * 20).toFixed(1) + 's');
      span.style.setProperty('--rot', (Math.random() * 16 - 8).toFixed(1) + 'deg');
      span.innerHTML = '<svg class="drift" width="' + size + '" height="' + Math.round(size * 1.35) + '" viewBox="0 0 ' + (i % 3 === 1 ? 34 : i % 3 === 2 ? 20 : 24) + ' 32"><use href="#lc-n' + (i % 3 + 1) + '"/></svg>';
      layer.appendChild(span);
    }
    place();
  }
  function place() {
    if (!layer) return;
    var rs = rects(), W = innerWidth, H = innerHeight;
    LC.qa('.note', layer).forEach(function (n) {
      var s = parseFloat(n.dataset.size) * 1.4, ok = false, x = 0, y = 0;
      for (var t = 0; t < 60 && !ok; t++) {
        x = Math.random() * (W - s); y = Math.random() * (H * 0.92 - s);
        ok = rs.every(function (r) { return x + s < r.left - 48 || x > r.right + 48 || y + s < r.top - 48 || y > r.bottom + 48; });
      }
      n.style.display = ok ? '' : 'none'; n.style.left = Math.round(x) + 'px'; n.style.top = Math.round(y) + 'px';
    });
    placed = true;
  }
  /* parallax */
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  function loop() {
    cx += (tx - cx) * .08; cy += (ty - cy) * .08;
    layer.style.setProperty('--px', cx.toFixed(2) + 'px'); layer.style.setProperty('--py', cy.toFixed(2) + 'px');
    if (Math.abs(tx - cx) > .1 || Math.abs(ty - cy) > .1) raf = requestAnimationFrame(loop); else raf = 0;
  }
  function parallax() {
    if (!layer) return;
    if (LC.fine.matches) {
      window.addEventListener('pointermove', function (e) {
        tx = (e.clientX / innerWidth - .5) * 36; ty = (e.clientY / innerHeight - .5) * 36;
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
    } else if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', function (e) {
        if (e.gamma == null || e.beta == null) return;
        tx = Math.max(-12, Math.min(12, e.gamma * .4)); ty = Math.max(-12, Math.min(12, (e.beta - 45) * .4));
        if (!raf) raf = requestAnimationFrame(loop);
      }, { passive: true });
    }
  }
  /* staff draw-in */
  function staffs() {
    var els = LC.qa('.staff'); if (!els.length) return;
    if (document.documentElement.classList.contains('intro-pending')) return;   /* intro.js draws the staff in its own timeline */
    if (!('IntersectionObserver' in window) || !LC.motionOK()) { els.forEach(function (s) { s.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .4 });
    els.forEach(function (s) { io.observe(s); });
  }
  /* reactions to notes: mascot hum, tile nod, rising note */
  var rising = 0;
  function spawn(host, cls, life) {
    if (!LC.motionOK() || rising > 3) return; rising++;
    var s = document.createElement('span'); s.className = cls; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="0 0 24 32" width="16" height="22"><use href="#lc-n1"/></svg>';
    host.appendChild(s); setTimeout(function () { s.remove(); rising--; }, life);
  }
  function react() {
    LC.on('note', function () {
      LC.qa('[data-mascot]').forEach(function (m) { spawn(m, 'hum', 1300); });
      LC.qa('[data-on-note~="nod"]').forEach(function (el) { el.classList.remove('nod'); void el.offsetWidth; el.classList.add('nod'); });
      LC.qa('[data-on-note~="rise"]').forEach(function (el) { spawn(el, 'rise', 1700); });
    });
    LC.on('intro:done', function () {
      LC.qa('.staff').forEach(function (s) { s.classList.add('in'); });
      var hosts = LC.qa('[data-on-note~="rise"]'); if (!hosts.length) return;
      setTimeout(function () { hosts.forEach(function (h) { spawn(h, 'rise', 1700); }); }, 800);
      setTimeout(function () { hosts.forEach(function (h) { spawn(h, 'rise', 1700); }); }, 4200);
    });
  }
  var rt;
  function init() {
    if (!LC.q('.ambient-defs')) document.body.insertAdjacentHTML('afterbegin', SYMBOLS);   /* hum/rise notes need the symbols even without the layer */
    build(); parallax(); staffs(); react();
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (layer) place(); }, 200); });
    window.addEventListener('orientationchange', function () { clearTimeout(rt); rt = setTimeout(function () { if (layer) place(); }, 350); });
    document.addEventListener('visibilitychange', function () { if (layer) layer.classList.toggle('paused', document.hidden); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  LC.ambient = { place: place };
})(window.LC);
