/* core.js — shared helpers for every page (classic script, loaded with defer). Exposes window.LC. */
window.LC = (function () {
  var d = document, h = d.documentElement;
  h.classList.remove('no-js'); h.classList.add('js');
  var red = matchMedia('(prefers-reduced-motion: reduce)');
  var fine = matchMedia('(hover: hover) and (pointer: fine)');
  var data = matchMedia('(prefers-reduced-data: reduce)');
  function param(k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); if (!m) return null; try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; } }
  function motionOK() { return !red.matches && param('motion') !== 'off'; }
  function flag() {
    h.classList.toggle('motion-ok', motionOK());
    h.classList.toggle('pointer-fine', fine.matches);
    h.classList.toggle('save-data', data.matches);
  }
  [red, fine, data].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', flag); else if (mq.addListener) mq.addListener(flag);
  });
  flag();
  function store(kind) {
    return {
      get: function (k) { try { return window[kind].getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { window[kind].setItem(k, v); } catch (e) {} },
      del: function (k) { try { window[kind].removeItem(k); } catch (e) {} }
    };
  }
  var listeners = {};
  return {
    motionOK: motionOK,
    fine: fine,
    reduceData: function () { return data.matches; },
    q: function (s, r) { return (r || d).querySelector(s); },
    qa: function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); },
    param: param,
    ss: store('sessionStorage'),
    ls: store('localStorage'),
    raf: function (fn) { var p = false; return function () { if (p) return; p = true; requestAnimationFrame(function () { p = false; fn(); }); }; },
    on: function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    emit: function (ev, detail) { (listeners[ev] || []).forEach(function (fn) { try { fn(detail); } catch (e) {} }); }
  };
})();
