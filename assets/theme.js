/* ═══════════════════════════════
   CHANTÈRO — THEME.JS
   Ann bar · Scroll reveal · Nav scroll · Mobile menu · Reel gallery
═══════════════════════════════ */

(function () {
  'use strict';

  /* ─── Announcement bar slider ─ */
  (function initAnn() {
    const ann = document.querySelector('.ann');
    if (!ann) return;
    const slides = ann.querySelectorAll('.ann-slide');
    const dots = ann.querySelectorAll('.ann-dot');
    if (slides.length < 2) {
      if (slides.length === 1) slides[0].classList.add('active');
      return;
    }
    let current = 0;
    function goTo(idx) {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = idx;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
    }
    goTo(0);
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); clearInterval(timer); timer = setInterval(advance, 4000); }));
    function advance() { goTo((current + 1) % slides.length); }
    let timer = setInterval(advance, 4000);
  })();

  /* ─── Nav scroll behaviour ───── */
  (function initNavScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ─── Mobile menu ─────────────── */
  (function initMobileMenu() {
    const burger   = document.getElementById('navHamburger');
    const menu     = document.getElementById('mobMenu');
    const close    = document.getElementById('mobClose');
    const overlay  = document.getElementById('mobOverlay');
    if (!burger || !menu) return;

    function openMenu() {
      menu.classList.add('open');
      burger.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      if (overlay) { overlay.classList.add('on'); overlay.setAttribute('aria-hidden', 'false'); }
      document.body.classList.add('no-scroll');
    }

    function closeMenu() {
      menu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      if (overlay) { overlay.classList.remove('on'); overlay.setAttribute('aria-hidden', 'true'); }
      document.body.classList.remove('no-scroll');
    }

    burger.addEventListener('click', openMenu);
    if (close) close.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  })();

  /* ─── Cart drawer ─────────────── */
  (function initCartDrawer() {
    const drawerOverlay = document.querySelector('.cart-drawer-overlay');
    const drawer        = document.querySelector('.cart-drawer');
    const drawerClose   = drawer ? drawer.querySelector('.cart-drawer-close') : null;

    function openCart() {
      if (!drawer) return;
      drawer.classList.add('open');
      if (drawerOverlay) drawerOverlay.classList.add('on');
      document.body.classList.add('no-scroll');
    }
    function closeCart() {
      if (!drawer) return;
      drawer.classList.remove('open');
      if (drawerOverlay) drawerOverlay.classList.remove('on');
      document.body.classList.remove('no-scroll');
    }

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-open-cart]');
      if (trigger) { e.preventDefault(); openCart(); }
    });
    if (drawerClose) drawerClose.addEventListener('click', closeCart);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeCart);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

    /* Expose for cart.js */
    window.Chantero = window.Chantero || {};
    window.Chantero.openCart  = openCart;
    window.Chantero.closeCart = closeCart;
  })();

  /* ─── Scroll reveal ──────────── */
  (function initReveal() {
    const els = document.querySelectorAll('.r');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('on'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => observer.observe(el));
  })();

  /* ─── Reel gallery drag-scroll ─ */
  (function initReelGallery() {
    const sliders = document.querySelectorAll('.reel-slider');
    sliders.forEach((slider) => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;

      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('active'); });
      slider.addEventListener('mouseup', () => { isDown = false; slider.classList.remove('active'); });
      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.4;
        slider.scrollLeft = scrollLeft - walk;
      });
    });

    /* Arrow controls */
    document.querySelectorAll('.reel-arrow').forEach((arrow) => {
      arrow.addEventListener('click', () => {
        const dir      = arrow.dataset.dir;
        const gallery  = arrow.closest('.reel-gallery, .watch-buy');
        const slider   = gallery ? gallery.querySelector('.reel-slider') : null;
        if (!slider) return;
        const tileW = slider.querySelector('.reel-tile')?.offsetWidth + 16 || 280;
        slider.scrollBy({ left: dir === 'next' ? tileW * 2 : -tileW * 2, behavior: 'smooth' });
      });
    });
  })();

  /* ─── Reel lightbox ───────────── */
  (function initReelLightbox() {
    const lb      = document.getElementById('reelLightbox');
    const lbVid   = lb ? lb.querySelector('.reel-lb-vid') : null;
    const lbClose = lb ? lb.querySelector('.reel-lb-close') : null;
    if (!lb) return;

    function openLb(src) {
      if (!lbVid) return;
      lbVid.src = src;
      lbVid.play();
      lb.classList.add('on');
      document.body.classList.add('no-scroll');
    }
    function closeLb() {
      lb.classList.remove('on');
      document.body.classList.remove('no-scroll');
      if (lbVid) { lbVid.pause(); lbVid.src = ''; }
    }

    document.addEventListener('click', (e) => {
      const tile = e.target.closest('.reel-tile');
      if (!tile) return;
      const src = tile.dataset.videoSrc || (tile.querySelector('video') ? tile.querySelector('video').src : null);
      if (src) openLb(src);
    });
    if (lbClose) lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  })();

  /* ─── Hover-play reel tiles ───── */
  (function initTileHoverPlay() {
    const tiles = document.querySelectorAll('.reel-tile');
    tiles.forEach((tile) => {
      const vid = tile.querySelector('.reel-tile-vid');
      if (!vid) return;
      tile.addEventListener('mouseenter', () => { vid.play().catch(() => {}); });
      tile.addEventListener('mouseleave', () => { vid.pause(); vid.currentTime = 0; });
    });
  })();

})();
