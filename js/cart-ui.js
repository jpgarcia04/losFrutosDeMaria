/**
 * ═══════════════════════════════════════════════════════════════
 *  Cart UI – Interfaz del carrito (drawer, badge, toast, botones)
 *
 *  Depende de: cart.js (window.LFDMCart)
 *  Estilos:    cart.css
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  const { PRODUCT_CATALOG, getCart, addToCart, removeFromCart, updateQuantity, getCartCount, getCartSubtotal } =
    window.LFDMCart;

  // Formato de moneda
  const fmtMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  // Envío V1
  const SHIPPING_FLAT = 120;
  const SHIPPING_FREE = 999;

  // Detectar ruta relativa para imágenes
  function imgPath(filename) {
    const isSubdir = /\/productos\/|\/examples\//.test(window.location.pathname);
    const prefix = isSubdir ? '../images/productos/' : 'images/productos/';
    return prefix + filename;
  }

  // Detectar ruta para checkout
  function checkoutPath() {
    const isSubdir = /\/productos\/|\/examples\//.test(window.location.pathname);
    return isSubdir ? '../checkout.html' : 'checkout.html';
  }

  // ── Toast System ────────────────────────────────────────────
  let toastContainer = null;

  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }

  function showToast(message, type = 'success') {
    ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast--out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 2000);
  }

  // ── Cart Badge ──────────────────────────────────────────────
  let badgeEl = null;
  let toggleBtn = null;

  function createCartToggle() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    toggleBtn = document.createElement('button');
    toggleBtn.className = 'cart-toggle';
    toggleBtn.setAttribute('aria-label', 'Abrir carrito');
    toggleBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    `;

    badgeEl = document.createElement('span');
    badgeEl.className = 'cart-toggle__badge';
    badgeEl.textContent = '0';
    toggleBtn.appendChild(badgeEl);

    toggleBtn.addEventListener('click', openDrawer);
    nav.appendChild(toggleBtn);

    updateBadge();
  }

  function updateBadge() {
    if (!badgeEl) return;
    const count = getCartCount();
    badgeEl.textContent = count;
    badgeEl.classList.toggle('is-visible', count > 0);
  }

  // ── Cart Drawer ─────────────────────────────────────────────
  let overlay = null;
  let drawer = null;
  let drawerBody = null;
  let drawerFooter = null;

  function createDrawer() {
    // Overlay
    overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.addEventListener('click', closeDrawer);

    // Drawer
    drawer = document.createElement('div');
    drawer.className = 'cart-drawer';

    // Header
    const header = document.createElement('div');
    header.className = 'cart-drawer__header';
    header.innerHTML = `
      <h2 class="cart-drawer__title">Tu carrito</h2>
      <button class="cart-drawer__close" aria-label="Cerrar carrito">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    header.querySelector('.cart-drawer__close').addEventListener('click', closeDrawer);

    // Body
    drawerBody = document.createElement('div');
    drawerBody.className = 'cart-drawer__body';

    // Footer
    drawerFooter = document.createElement('div');
    drawerFooter.className = 'cart-drawer__footer';

    drawer.appendChild(header);
    drawer.appendChild(drawerBody);
    drawer.appendChild(drawerFooter);

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  function renderDrawer() {
    if (!drawerBody || !drawerFooter) return;

    const cart = getCart();

    if (cart.length === 0) {
      drawerBody.innerHTML = `
        <div class="cart-drawer__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p>Tu carrito está vacío</p>
          <a href="${window.location.pathname.includes('productos') ? '../index.html#productos' : 'index.html#productos'}">Ver productos →</a>
        </div>
      `;
      drawerFooter.style.display = 'none';
      return;
    }

    // Render items
    let itemsHtml = '';
    cart.forEach((item) => {
      const product = PRODUCT_CATALOG[item.id];
      if (!product) return;

      itemsHtml += `
        <div class="cart-item" data-id="${item.id}">
          <img class="cart-item__image" src="${imgPath(product.image)}" alt="${product.name}" />
          <div class="cart-item__info">
            <span class="cart-item__name">${product.name}</span>
            <span class="cart-item__price">${fmtMXN.format(product.price)}</span>
            <div class="cart-item__controls">
              <button class="cart-item__qty-btn" data-action="minus" data-id="${item.id}" aria-label="Menos">−</button>
              <span class="cart-item__qty">${item.quantity}</span>
              <button class="cart-item__qty-btn" data-action="plus" data-id="${item.id}" aria-label="Más">+</button>
            </div>
          </div>
          <button class="cart-item__remove" data-action="remove" data-id="${item.id}" aria-label="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    });

    drawerBody.innerHTML = itemsHtml;

    // Footer
    const subtotal = getCartSubtotal();
    const shipping = subtotal >= SHIPPING_FREE ? 0 : SHIPPING_FLAT;

    drawerFooter.style.display = '';
    drawerFooter.innerHTML = `
      <div class="cart-drawer__subtotal">
        <span>Subtotal</span>
        <span>${fmtMXN.format(subtotal)}</span>
      </div>
      <div class="cart-drawer__shipping-note">
        ${shipping === 0
          ? '✓ ¡Envío gratis incluido!'
          : `Envío: ${fmtMXN.format(SHIPPING_FLAT)} · Gratis a partir de ${fmtMXN.format(SHIPPING_FREE)}`
        }
      </div>
      <a href="${checkoutPath()}" class="cart-drawer__checkout-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Proceder al pago
      </a>
    `;

    // Event delegation para controles
    drawerBody.addEventListener('click', handleCartAction);
  }

  function handleCartAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);
    const cart = getCart();
    const item = cart.find((i) => i.id === id);

    if (action === 'plus') {
      addToCart(id, 1);
    } else if (action === 'minus' && item) {
      updateQuantity(id, item.quantity - 1);
    } else if (action === 'remove') {
      removeFromCart(id);
    }
  }

  function openDrawer() {
    if (!overlay || !drawer) return;
    renderDrawer();
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!overlay || !drawer) return;
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // ── Add to Cart Buttons ─────────────────────────────────────
  function bindAddToCartButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-add-to-cart');
      if (!btn) return;

      e.preventDefault();
      const productId = Number(btn.dataset.productId);

      if (!productId || !PRODUCT_CATALOG[productId]) {
        showToast('Producto no válido', 'error');
        return;
      }

      addToCart(productId, 1);
      showToast('Producto agregado ✓', 'success');

      // Brief animation
      btn.classList.add('btn-add-to-cart--added');
      setTimeout(() => btn.classList.remove('btn-add-to-cart--added'), 500);
    });
  }

  // ── Escuchar cambios del carrito ────────────────────────────
  function bindCartEvents() {
    window.addEventListener('cart-updated', () => {
      updateBadge();
      // Re-render drawer si está abierto
      if (drawer && drawer.classList.contains('is-open')) {
        renderDrawer();
      }
    });
  }

  // ── Init ────────────────────────────────────────────────────
  function init() {
    createCartToggle();
    createDrawer();
    bindAddToCartButtons();
    bindCartEvents();
    updateBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.LFDMCartUI = { openDrawer, closeDrawer, showToast, init };
})();
