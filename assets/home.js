/* 首页灯箱：点击放大、左右切换、手机滑动、键盘方向键
   零依赖，所有节点先判空，出错不影响页面其它功能 */
(function () {
  var gal = document.getElementById('gal');
  var dlg = document.getElementById('lb');
  if (!gal || !dlg) return;

  var btns = Array.prototype.slice.call(gal.querySelectorAll('button[data-full]'));
  if (!btns.length) return;

  var img = document.getElementById('lbImg');
  var nowEl = document.getElementById('lbNow');
  var allEl = document.getElementById('lbAll');
  var idx = 0;

  if (allEl) allEl.textContent = String(btns.length);

  function frame(i) {
    return (i + btns.length) % btns.length;
  }

  function show(i, keepFocus) {
    idx = frame(i);
    var b = btns[idx];
    var thumb = b.querySelector('img');
    img.src = b.getAttribute('data-full');
    img.alt = thumb ? (thumb.alt || '') : '';
    if (nowEl) nowEl.textContent = String(idx + 1);

    // 预取左右两张，切图不白屏
    [idx - 1, idx + 1].forEach(function (k) {
      var p = new Image();
      p.src = btns[frame(k)].getAttribute('data-full');
    });
    if (keepFocus !== false) dlg.focus();
  }

  function open(i) {
    show(i);
    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
    } else {
      dlg.setAttribute('open', '');
    }
    document.documentElement.style.overflow = 'hidden';
  }

  function close() {
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
    document.documentElement.style.overflow = '';
  }

  btns.forEach(function (b, i) {
    b.addEventListener('click', function () { open(i); });
  });

  var btnX = dlg.querySelector('.lb-x');
  var btnPrev = dlg.querySelector('.lb-prev');
  var btnNext = dlg.querySelector('.lb-next');
  if (btnX) btnX.addEventListener('click', close);
  if (btnPrev) btnPrev.addEventListener('click', function () { show(idx - 1); });
  if (btnNext) btnNext.addEventListener('click', function () { show(idx + 1); });

  // 点空白处关闭（点在图上不关）
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.classList.contains('lb-stage')) close();
  });

  // Esc 由 dialog 原生处理；这里补方向键
  document.addEventListener('keydown', function (e) {
    if (!dlg.open) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
  });

  // 手机滑动
  var sx = 0, sy = 0, tracking = false;
  var stage = dlg.querySelector('.lb-stage') || dlg;

  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  stage.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - sx;
    var dy = t.clientY - sy;
    if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) {
      show(dx < 0 ? idx + 1 : idx - 1);
    }
  }, { passive: true });
})();
