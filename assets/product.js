/* ═══════════════════════════════
   CHANTÈRO — PRODUCT.JS
   Gallery · Variant picker · Accordions · Sticky ATC · Watch & Buy
═══════════════════════════════ */

(function () {
  'use strict';

  /* ─── Gallery switcher ───────── */
  const thumbs = document.querySelectorAll('.thumb');
  const mainImg = document.querySelector('.main-img');
  const dots = document.querySelectorAll('.img-dot');

  /* Build image src map from preloaded data spans */
  const imgDataMap = {};
  document.querySelectorAll('.gallery-img-data').forEach((el) => {
    imgDataMap[el.dataset.idx] = { src: el.dataset.src, alt: el.dataset.alt };
  });

  function activateThumb(index) {
    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === index);
      t.setAttribute('aria-pressed', i === index ? 'true' : 'false');
    });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === index);
      d.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    if (mainImg) {
      const imgData = imgDataMap[index];
      const thumb = thumbs[index];
      const newSrc = imgData?.src || thumb?.querySelector('img')?.src;
      const newAlt = imgData?.alt || thumb?.querySelector('img')?.alt || '';
      if (newSrc && newSrc !== mainImg.src) {
        mainImg.classList.add('fade');
        setTimeout(() => {
          mainImg.src = newSrc;
          if (newAlt) mainImg.alt = newAlt;
          mainImg.classList.remove('fade');
        }, 220);
      }
    }
  }

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => activateThumb(i));
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateThumb(i);
      }
    });
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => activateThumb(i));
  });

  /* ─── Variant picker ─────────── */
  const variantInput = document.querySelector('input[name="id"]');
  const sizeTiles = document.querySelectorAll('.size-tile');
  const priceEl = document.getElementById('pdPrice');
  const comparePriceEl = document.getElementById('pdCompare');
  const stickyPriceEl = document.getElementById('stickyPrice');
  const atcBtn = document.querySelector('[data-atc-btn]');
  const soldOutMsg = document.querySelector('[data-sold-out]');
  const unavailableMsg = document.querySelector('[data-unavailable]');

  sizeTiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      if (tile.dataset.available === 'false' && tile.dataset.soldOut === 'true') return;

      sizeTiles.forEach((t) => t.classList.remove('active'));
      tile.classList.add('active');

      if (variantInput) {
        variantInput.value = tile.dataset.variantId;
      }
      const displayPrice = tile.dataset.priceFormatted || tile.dataset.price;
      if (priceEl && displayPrice) priceEl.textContent = displayPrice;
      if (stickyPriceEl && displayPrice) stickyPriceEl.textContent = displayPrice;
      if (comparePriceEl) {
        if (tile.dataset.comparePrice && tile.dataset.comparePrice !== tile.dataset.price) {
          comparePriceEl.textContent = tile.dataset.comparePriceFormatted || '';
          comparePriceEl.style.display = '';
        } else {
          comparePriceEl.style.display = 'none';
        }
      }
      if (atcBtn) {
        const available = tile.dataset.available !== 'false';
        atcBtn.disabled = !available;
        if (!available) {
          atcBtn.textContent = 'Sold Out';
        } else {
          atcBtn.textContent = 'Add to Cart';
        }
      }
      if (soldOutMsg) {
        soldOutMsg.style.display = tile.dataset.available === 'false' ? '' : 'none';
      }
    });
  });

  /* ─── Quantity selector ──────── */
  const qtyInput = document.querySelector('[data-qty-input]');
  const qtyMinus = document.querySelector('[data-qty-minus]');
  const qtyPlus = document.querySelector('[data-qty-plus]');

  if (qtyMinus) {
    qtyMinus.addEventListener('click', () => {
      const current = parseInt(qtyInput?.value || 1, 10);
      if (current > 1 && qtyInput) qtyInput.value = current - 1;
    });
  }
  if (qtyPlus) {
    qtyPlus.addEventListener('click', () => {
      const current = parseInt(qtyInput?.value || 1, 10);
      if (qtyInput) qtyInput.value = current + 1;
    });
  }

  /* ─── Accordion ──────────────── */
  document.querySelectorAll('.accord-head').forEach((head) => {
    head.addEventListener('click', () => {
      const accord = head.closest('.accord');
      if (!accord) return;
      const isOpen = accord.classList.contains('open');
      document.querySelectorAll('.accord.open').forEach((a) => {
        a.classList.remove('open');
        const btn = a.querySelector('button.accord-head[aria-expanded]') || a.querySelector('.accord-head');
        if (btn && btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
        const body = a.querySelector('.accord-body');
        if (body) body.hidden = true;
      });
      if (!isOpen) {
        accord.classList.add('open');
        if (head.hasAttribute('aria-expanded')) head.setAttribute('aria-expanded', 'true');
        const body = accord.querySelector('.accord-body');
        if (body) body.hidden = false;
      }
    });
  });

  /* ─── Sticky mobile ATC ──────── */
  const stickyAtcBar = document.getElementById('stickyAtc');
  const mainAtc = document.querySelector('.atc-row');
  const stickyAtcBtn = document.querySelector('[data-sticky-atc]');

  if (stickyAtcBar && mainAtc) {
    const stickyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const show = !entry.isIntersecting;
          stickyAtcBar.hidden = !show;
          stickyAtcBar.setAttribute('aria-hidden', String(!show));
        });
      },
      { threshold: 0, rootMargin: '0px 0px -100px 0px' }
    );
    stickyObserver.observe(mainAtc);
  }

  if (stickyAtcBtn) {
    stickyAtcBtn.addEventListener('click', () => {
      const form = document.getElementById('product-form');
      if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
    });
  }

  /* ─── Watch & Buy IntersectionObserver ── */
  const watchVideos = document.querySelectorAll('.watch-frame video');
  if (watchVideos.length > 0) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.play().catch(() => {});
          } else {
            entry.target.pause();
          }
        });
      },
      { threshold: 0.5 }
    );
    watchVideos.forEach((v) => videoObserver.observe(v));
  }

  /* ─── Sync qty to hidden input ── */
  const productForm = document.querySelector('#product-form');
  if (productForm && qtyInput) {
    const hiddenQty = productForm.querySelector('input[name="quantity"]');
    if (hiddenQty) {
      qtyInput.addEventListener('change', () => {
        hiddenQty.value = qtyInput.value;
      });
    }
  }

})();
