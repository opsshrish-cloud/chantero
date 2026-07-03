/* ═══════════════════════════════
   CHANTÈRO — CART.JS
   AJAX add-to-cart · Cart drawer · Qty update · Remove item
   Targets cart-drawer.liquid DOM structure
═══════════════════════════════ */

(function () {
  'use strict';

  const THRESHOLD_CENTS = 650000; // ₹6,500 free shipping threshold

  const drawer     = document.getElementById('cartDrawer');
  const overlay    = document.getElementById('cartDrawerOverlay');
  const closeBtn   = drawer && drawer.querySelector('.cart-drawer-close');
  const linesEl    = document.getElementById('cartDrawerLines');
  const drawerCountEl = document.getElementById('cartDrawerCount');
  const subtotalEl = document.getElementById('cartSubtotalPrice');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  const headerCountEl = document.getElementById('cartN');
  const thresholdEl = document.getElementById('cartThreshold');

  /* ─── Money formatter ────────────── */
  function money(cents) {
    return '₹' + (cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  /* ─── Open / Close drawer ─────────── */
  function openCart() {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'false');
    if (overlay) overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeCart() {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  if (closeBtn)  closeBtn.addEventListener('click', closeCart);
  if (overlay)   overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  /* Open drawer on [data-open-cart] clicks (handled by theme.js too) */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-cart]');
    if (!trigger) return;
    e.preventDefault();
    fetchCart().then(renderCart).then(openCart);
  });

  /* Expose globals for theme.js interop */
  window.Chantero = window.Chantero || {};
  window.Chantero.openCart  = () => fetchCart().then(renderCart).then(openCart);
  window.Chantero.closeCart = closeCart;

  /* ─── Fetch cart JSON ─────────────── */
  function fetchCart() {
    return fetch(window.Shopify ? '/cart.js' : '/cart.js')
      .then((r) => r.json())
      .catch(() => ({ items: [], item_count: 0, total_price: 0 }));
  }

  /* ─── Update badge counts ─────────── */
  function updateCounts(cart) {
    const n = cart.item_count;
    if (headerCountEl) headerCountEl.textContent = n;
    if (drawerCountEl) drawerCountEl.textContent = n;
    if (checkoutBtn) {
      if (n === 0) {
        checkoutBtn.setAttribute('aria-disabled', 'true');
        checkoutBtn.style.pointerEvents = 'none';
        checkoutBtn.style.opacity = '0.5';
      } else {
        checkoutBtn.removeAttribute('aria-disabled');
        checkoutBtn.style.pointerEvents = '';
        checkoutBtn.style.opacity = '';
      }
    }
  }

  /* ─── Update threshold bar ────────── */
  function updateThreshold(cart) {
    if (!thresholdEl) return;
    const remaining = THRESHOLD_CENTS - cart.total_price;
    const pct = Math.min(100, Math.round(cart.total_price * 100 / THRESHOLD_CENTS));
    const fill = thresholdEl.querySelector('.cart-threshold-fill');
    const msg  = thresholdEl.querySelector('span');
    if (fill) fill.style.width = pct + '%';
    if (msg) {
      msg.innerHTML = remaining <= 0
        ? 'You qualify for complimentary shipping'
        : 'Add <strong>' + money(remaining) + '</strong> more for complimentary shipping';
    }
  }

  /* ─── Update subtotal ─────────────── */
  function updateSubtotal(cart) {
    if (subtotalEl) subtotalEl.textContent = money(cart.total_price);
  }

  /* ─── Render line items ───────────── */
  function renderLines(cart) {
    if (!linesEl) return;
    if (cart.item_count === 0) {
      linesEl.innerHTML = `
        <div class="cart-drawer-empty">
          <p>Your cart is empty</p>
          <p>Choose a scent, sample first, or build a gift.</p>
          <a class="btn btn-gold" href="/collections/all">Explore Collection</a>
        </div>`;
      return;
    }
    linesEl.innerHTML = cart.items.map((item) => {
      const img = item.featured_image
        ? `<img class="cart-line-img" src="${item.featured_image.url}" alt="${escHtml(item.featured_image.alt || item.title)}" width="80" height="96" loading="lazy" />`
        : '';
      const variant = item.variant_title && item.variant_title !== 'Default Title'
        ? `<span class="cart-line-variant">${escHtml(item.variant_title)}</span>`
        : '';
      const priceHtml = item.original_line_price !== item.final_line_price
        ? `<s style="opacity:0.50;">${money(item.original_line_price)}</s> ${money(item.final_line_price)}`
        : money(item.final_line_price);
      return `
        <div class="cart-line" data-key="${item.key}">
          <a href="${item.url}">${img}</a>
          <div class="cart-line-info">
            <a class="cart-line-title" href="${item.url}">${escHtml(item.product_title)}</a>
            ${variant}
            <span class="cart-line-price">${priceHtml}</span>
            <div class="cart-line-actions">
              <div class="cart-qty">
                <button class="cart-qty-btn" data-change="-1" data-key="${item.key}" aria-label="Decrease quantity">−</button>
                <span class="cart-qty-val">${item.quantity}</span>
                <button class="cart-qty-btn" data-change="1" data-key="${item.key}" aria-label="Increase quantity">+</button>
              </div>
              <button class="cart-line-remove" data-key="${item.key}" data-qty="0">Remove</button>
            </div>
          </div>
        </div>`;
    }).join('');
    bindLineEvents();
  }

  /* ─── Render full cart ────────────── */
  function renderCart(cart) {
    updateCounts(cart);
    updateThreshold(cart);
    updateSubtotal(cart);
    renderLines(cart);
  }

  /* ─── Bind line item events ──────── */
  function bindLineEvents() {
    if (!linesEl) return;
    linesEl.querySelectorAll('.cart-qty-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const line = btn.closest('.cart-line');
        const valEl = line && line.querySelector('.cart-qty-val');
        const current = valEl ? parseInt(valEl.textContent, 10) : 1;
        const delta = parseInt(btn.dataset.change, 10);
        changeQty(key, Math.max(0, current + delta));
      });
    });
    linesEl.querySelectorAll('.cart-line-remove').forEach((btn) => {
      btn.addEventListener('click', () => changeQty(btn.dataset.key, 0));
    });
  }

  /* ─── Change quantity ─────────────── */
  function changeQty(key, quantity) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity }),
    })
      .then((r) => r.json())
      .then(renderCart)
      .catch(console.error);
  }

  /* ─── Add to cart ─────────────────── */
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('#product-form, [data-product-form]');
    if (!form) return;
    e.preventDefault();

    const btn = form.querySelector('[data-atc-btn], [name="add"]');
    const errorEl = form.querySelector('.product-form-error');

    if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }

    fetch('/cart/add.js', { method: 'POST', body: new FormData(form) })
      .then((r) => r.ok ? r.json() : r.json().then((d) => Promise.reject(d)))
      .then(() => fetchCart())
      .then((cart) => {
        renderCart(cart);
        openCart();
        if (btn) { btn.disabled = false; btn.textContent = 'Add to Cart'; }
        if (errorEl) errorEl.classList.remove('visible');
      })
      .catch((err) => {
        if (btn) { btn.disabled = false; btn.textContent = 'Add to Cart'; }
        if (errorEl) {
          errorEl.textContent = err.description || 'Sorry, something went wrong. Please try again.';
          errorEl.classList.add('visible');
        }
      });
  });

  /* ─── Escape HTML helper ──────────── */
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─── Init ────────────────────────── */
  fetchCart().then((c) => { updateCounts(c); updateThreshold(c); updateSubtotal(c); });

})();
