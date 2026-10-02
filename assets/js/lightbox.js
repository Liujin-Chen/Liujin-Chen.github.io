/* lightbox.js — <dialog> zoom/pan viewer for the poster. Opener: <a href="img/poster-1800.jpg" data-lightbox>
   Dialog: <dialog class="lightbox" id="lb"> <div class="stage"><img id="lb-img" data-src=… data-hires=…></div> … </dialog> */
(function (LC) {
  var lb = LC.q('#lb'), opener = LC.q('[data-lightbox]');
  if (!lb || !opener || typeof lb.showModal !== 'function') return;   /* no <dialog> → the link opens the image */
  var stage = LC.q('.stage', lb), img = LC.q('#lb-img', lb), closeBtn = LC.q('.lb-close', lb);
  opener.setAttribute('aria-haspopup', 'dialog');
  var s = 1, tx = 0, ty = 0, raf = 0, MIN = 1, MAX = 6, pts = new Map(), d0 = 0, m0 = null, lastTap = 0, hires = false, moved = false;
  function apply() { raf = 0; img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')'; }
  function draw() { if (!raf) raf = requestAnimationFrame(apply); }
  function base() {   /* image fitted to the stage at scale 1 */
    var W = stage.clientWidth, H = stage.clientHeight, iw = img.naturalWidth || 3, ih = img.naturalHeight || 4, k = Math.min(W / iw, H / ih);
    img.style.width = Math.round(iw * k) + 'px'; img.style.height = Math.round(ih * k) + 'px';
  }
  function clamp() {
    var W = stage.clientWidth, H = stage.clientHeight, w = img.offsetWidth * s, h = img.offsetHeight * s;
    tx = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, tx));
    ty = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, ty));
  }
  function zoomAt(cx, cy, f) {
    var ns = Math.min(MAX, Math.max(MIN, s * f)), k = ns / s, r = stage.getBoundingClientRect();
    cx -= r.left; cy -= r.top; tx = cx - (cx - tx) * k; ty = cy - (cy - ty) * k; s = ns; clamp(); draw();
    if (s > 1.6 && !hires && img.dataset.hires) { hires = true; var pre = new Image(); pre.onload = function () { img.src = img.dataset.hires; }; pre.src = img.dataset.hires; }
  }
  stage.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))); }, { passive: false });
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || (e.pointerType !== 'touch' && !e.isPrimary)) return;
    stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false;
    if (pts.size === 2) { var v = Array.from(pts.values()); d0 = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]); m0 = [(v[0][0] + v[1][0]) / 2, (v[0][1] + v[1][1]) / 2]; }
  });
  stage.addEventListener('pointermove', function (e) {
    if (!pts.has(e.pointerId)) return;
    var p = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (Math.abs(e.clientX - p[0]) + Math.abs(e.clientY - p[1]) > 2) moved = true;
    if (pts.size === 1) { tx += e.clientX - p[0]; ty += e.clientY - p[1]; clamp(); draw(); }
    else if (pts.size === 2) {
      var v = Array.from(pts.values()), d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]), m = [(v[0][0] + v[1][0]) / 2, (v[0][1] + v[1][1]) / 2];
      tx += m[0] - m0[0]; ty += m[1] - m0[1]; zoomAt(m[0], m[1], d / d0); d0 = d; m0 = m;
    }
  });
  function up(e) {
    if (pts.has(e.pointerId) && pts.size === 1 && !moved) {
      var now = performance.now();
      if (now - lastTap < 300) { zoomAt(e.clientX, e.clientY, s > 1.5 ? 1 / s : 2.5); lastTap = 0; } else lastTap = now;   /* double-tap, iOS fires no dblclick */
    }
    pts.delete(e.pointerId);
  }
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', function (e) { pts.delete(e.pointerId); }); stage.addEventListener('lostpointercapture', function (e) { pts.delete(e.pointerId); });
  function open() {
    if (!img.src) img.src = img.dataset.src;
    s = 1; tx = ty = 0; hires = false; lb.showModal(); document.documentElement.classList.add('lb-open');
    var ready = function () { base(); clamp(); apply(); };
    if (img.complete && img.naturalWidth) ready(); else img.onload = ready;
    if (closeBtn) closeBtn.focus();
  }
  opener.addEventListener('click', function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); open(); });
  if (closeBtn) closeBtn.addEventListener('click', function () { lb.close(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });   /* dimmed margin around the stage */
  lb.addEventListener('close', function () { document.documentElement.classList.remove('lb-open'); opener.focus(); });
  LC.qa('[data-lb-zoom]', lb).forEach(function (b) { b.addEventListener('click', function () {
    var r = stage.getBoundingClientRect(), f = b.dataset.lbZoom; var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (f === 'reset') { s = 1; tx = ty = 0; clamp(); draw(); } else zoomAt(cx, cy, f === 'in' ? 1.4 : 1 / 1.4);
  }); });
  window.addEventListener('keydown', function (e) {
    if (!lb.open) return; var r = stage.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (e.key === '+' || e.key === '=') zoomAt(cx, cy, 1.25);
    else if (e.key === '-') zoomAt(cx, cy, .8);
    else if (e.key === '0') { s = 1; tx = ty = 0; clamp(); draw(); }
    else if (e.key.indexOf('Arrow') === 0) { tx += e.key === 'ArrowLeft' ? 40 : e.key === 'ArrowRight' ? -40 : 0; ty += e.key === 'ArrowUp' ? 40 : e.key === 'ArrowDown' ? -40 : 0; clamp(); draw(); e.preventDefault(); }
  });
  window.addEventListener('resize', function () { if (lb.open) { base(); clamp(); draw(); } });
})(window.LC);
