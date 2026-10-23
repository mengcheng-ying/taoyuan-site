/* 桃园：将帅录 —— 交互脚本（零依赖）
   只做三件事：
   1. 打 .js 标记（无 JS 时 .rv 默认可见，不白屏）
   2. 滚动淡入（IntersectionObserver，进入即 unobserve）
   3. 顶栏滚动加深 + 底部标签栏选中态
*/
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  /* ── 2. 滚动淡入 ── */
  var items = [].slice.call(document.querySelectorAll('.rv'));
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    // 同父级兄弟错峰，最多 3 档
    items.forEach(function (el) {
      var sibs = el.parentNode ? [].filter.call(el.parentNode.children, function (n) {
        return n.classList && n.classList.contains('rv');
      }) : [];
      var i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', (Math.min(i, 3) * 70) + 'ms');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });

    /* 兜底 1：首屏内的元素立刻显示，不等回调（避免首帧空白） */
    var vh = window.innerHeight || 800;
    items.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh) el.classList.add('in');
    });

    /* 兜底 2：滚动时再扫一遍。
       IntersectionObserver 在极端情况下（快速滚动、无渲染帧）会漏回调，
       元素就会卡在 opacity:0 —— 对用户是白屏。这里用滚动事件补一次，
       只做"进入视口就显示"，不改变动画本身的观感。 */
    var pending, ticking = false;
    var sweep = function () {
      ticking = false;
      var h = window.innerHeight || 800;
      for (var i = pending.length - 1; i >= 0; i--) {
        var el = pending[i];
        if (!el.classList.contains('in') && el.getBoundingClientRect().top < h * 0.92) {
          el.classList.add('in');
          pending.splice(i, 1);
        }
      }
    };
    pending = items.filter(function (el) { return !el.classList.contains('in'); });
    if (pending.length) {
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(sweep);
      }, { passive: true });
      sweep();
    }
  }

  /* ── 3a. 顶栏滚动加深 ── */
  var hd = document.querySelector('.hd');
  if (hd) {
    var last = -1;
    var onScroll = function () {
      var y = window.pageYOffset || doc.scrollTop;
      var solid = y > 12;
      if (solid !== last) {
        hd.classList.toggle('is-solid', solid);
        last = solid;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 3b. 底部标签栏选中态（按路径匹配，不写死） ── */
  var tabbar = document.querySelector('.tabbar');
  if (tabbar) {
    var p = location.pathname.replace(/\/index\.html$/, '/');
    [].slice.call(tabbar.querySelectorAll('a')).forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var hit = (href === '/' && (p === '/' || p === '/index.html')) ||
                (href !== '/' && p.indexOf(href.replace(/\.html$/, '')) === 0);
      a.classList.toggle('on', hit);
      if (hit) a.setAttribute('aria-current', 'page');
    });
  }
})();
