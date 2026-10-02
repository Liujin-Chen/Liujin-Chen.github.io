/* tilt.js — gentle 3D paper tilt for .tilt elements (mouse/pen only, never under reduced motion). */
(function (LC) {
  function init() {
    if (!LC.fine.matches || !LC.motionOK()) return;
    LC.qa('.tilt').forEach(function (el) {
      var max = parseFloat(el.dataset.tiltMax) || 6, r = null, tx = 0, ty = 0, raf = 0;
      function frame() {
        raf = 0;
        el.style.setProperty('--rx', ty.toFixed(2) + 'deg'); el.style.setProperty('--ry', tx.toFixed(2) + 'deg');
        el.style.setProperty('--sx', (-tx * 1.4).toFixed(1) + 'px'); el.style.setProperty('--sy', (ty * 1.4).toFixed(1) + 'px');
      }
      el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'touch') return; r = el.getBoundingClientRect(); el.classList.add('tilting'); });
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch' || !el.classList.contains('tilting')) return;
        if (!r) r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        tx = Math.max(-max, Math.min(max, dx * 2 * max)); ty = Math.max(-max, Math.min(max, -dy * 2 * max));
        if (!raf) raf = requestAnimationFrame(frame);
      });
      el.addEventListener('pointerleave', function () { tx = ty = 0; el.classList.remove('tilting'); frame(); r = null; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.LC);
