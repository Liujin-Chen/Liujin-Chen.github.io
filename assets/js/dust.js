/* dust.js — pooled canvas chalk-dust particles. LC.dust.burst(x, y, n, "r,g,b") */
(function (LC) {
  var canvas, ctx, pool = [], raf = 0, last = 0, DPR = Math.min(2, window.devicePixelRatio || 1), MAX = 40;
  function size() {
    canvas.width = Math.round(innerWidth * DPR); canvas.height = Math.round(innerHeight * DPR);
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
  }
  function ensure() {
    if (canvas) return;
    canvas = document.createElement('canvas'); canvas.className = 'dust-layer'; canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas); ctx = canvas.getContext('2d'); size();
    window.addEventListener('resize', size);
    for (var i = 0; i < MAX; i++) pool.push({ alive: false });
  }
  function themeColor() {
    var c = getComputedStyle(document.documentElement).getPropertyValue('--dust').trim();
    return c || '148,126,56';
  }
  function burst(x, y, n, rgb) {
    if (!LC.motionOK()) return; ensure();
    var col = rgb || themeColor(), made = 0, want = n || 10;
    for (var i = 0; i < pool.length && made < want; i++) {
      var p = pool[i]; if (p.alive) continue;
      var a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 2.4;
      p.alive = true; p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 1.2;
      p.r = 1 + Math.random() * 2.2; p.max = p.life = 450 + Math.random() * 250; p.rgb = col; made++;
    }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  function tick(now) {
    var dt = Math.min(32, now - last), live = 0; last = now;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < pool.length; i++) {
      var p = pool[i]; if (!p.alive) continue;
      p.life -= dt; if (p.life <= 0) { p.alive = false; continue; }
      var f = dt / 16; p.vy += 0.12 * f; p.x += p.vx * f; p.y += p.vy * f;
      var k = p.life / p.max;
      ctx.beginPath(); ctx.fillStyle = 'rgba(' + p.rgb + ',' + (k * 0.9).toFixed(3) + ')';
      ctx.arc(p.x * DPR, p.y * DPR, Math.max(0.3, p.r * k) * DPR, 0, 6.2832); ctx.fill(); live++;
    }
    if (live) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }
  LC.dust = { burst: burst };
})(window.LC);
