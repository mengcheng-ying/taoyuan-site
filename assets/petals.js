/* ==========================================================================
   樱花飘落 —— 与首页主视觉的樱花同色系
   做法：离屏预渲染 3 张花瓣贴图，每帧只做 drawImage，不逐帧画路径、不用 shadow
   性能：花瓣数按屏宽给（手机 10 / 平板 14 / 桌面 18），DPR 上限 1.5，
        切到后台自动暂停，系统开启"减少动态效果"则整体不启动
   ========================================================================== */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'petals';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;' +
    'pointer-events:none;z-index:30;display:block';
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var W = 0, H = 0;

  /* ── 预渲染花瓣贴图 ── */
  var PINKS = [
    ['#F9CADC', '#E98FB0'],
    ['#F7C2D5', '#E481A6'],
    ['#FDE4EE', '#EFA2BF']
  ];

  function makeSprite(c0, c1) {
    var S = 64;
    var c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d');

    // 花瓣：上尖下圆，带一个浅缺口
    g.translate(S / 2, S / 2);
    g.beginPath();
    g.moveTo(0, -20);
    g.bezierCurveTo(15, -12, 16, 8, 6, 19);
    g.bezierCurveTo(3, 21, -3, 21, -6, 19);
    g.bezierCurveTo(-16, 8, -15, -12, 0, -20);
    g.closePath();

    var grad = g.createLinearGradient(0, -20, 0, 20);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, c1);
    g.fillStyle = grad;
    g.fill();

    // 中脉，增加一点质感
    g.strokeStyle = 'rgba(255,255,255,.7)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, -14);
    g.lineTo(0, 14);
    g.stroke();

    return c;
  }

  var sprites = PINKS.map(function (p) { return makeSprite(p[0], p[1]); });

  /* ── 花瓣对象 ── */
  var petals = [];

  function targetCount() {
    var w = window.innerWidth;
    if (w < 600) return 9;
    if (w < 1024) return 13;
    return 18;
  }

  function reset(p, initial) {
    p.x = Math.random() * (W + 120) - 60;
    p.y = initial ? Math.random() * H : -40 - Math.random() * 120;
    p.size = 11 + Math.random() * 9;         // 11~20px
    p.vy = 16 + Math.random() * 26;          // 每秒下落 16~42px，慢
    p.sway = 10 + Math.random() * 22;        // 横向摆幅
    p.swaySpeed = 0.4 + Math.random() * 0.7; // 摆动频率
    p.phase = Math.random() * Math.PI * 2;
    p.rot = Math.random() * Math.PI * 2;
    p.vr = (Math.random() - 0.5) * 0.5;      // 自转速度
    p.alpha = 0.55 + Math.random() * 0.32;
    p.sprite = sprites[(Math.random() * sprites.length) | 0];
    p.t = 0;
  }

  function build() {
    var n = targetCount();
    petals.length = 0;
    for (var i = 0; i < n; i++) {
      var p = {};
      reset(p, true);
      petals.push(p);
    }
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (petals.length !== targetCount()) build();
  }

  /* ── 动画 ── */
  var last = 0, raf = 0, running = true;

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;

    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < petals.length; i++) {
      var p = petals[i];
      p.t += dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      var x = p.x + Math.sin(p.phase + p.t * p.swaySpeed) * p.sway;

      if (p.y > H + 40) reset(p, false);
      if (x < -80 || x > W + 80) { p.x = Math.random() * W; }

      ctx.globalAlpha = p.alpha;
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size * 1.15);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* 后台暂停，省电；低端机也不至于一直跑 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(resize, 180);
  }, { passive: true });

  resize();
  start();
})();
