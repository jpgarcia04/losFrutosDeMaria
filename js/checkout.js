/**
 * ═══════════════════════════════════════════════════════════════
 *  Checkout – Orquestación del pago vía backend LFDM
 *
 *  El navegador NUNCA fija precios: envía ids + cantidades al
 *  backend (https://bj-api.site), que valida contra la BD, crea
 *  la orden y devuelve el link de pago hosted de EcartPay.
 *  Depende de: cart.js (window.LFDMCart)
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ── Configuración ───────────────────────────────────────────
  const API_BASE_URL = 'https://bj-api.site/api/v1';

  const { PRODUCT_CATALOG, getCart, clearCart } = window.LFDMCart;

  // Formato de moneda
  const formatMXN = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  // ── Estado ──────────────────────────────────────────────────
  let isProcessing = false;

  // ── Elementos del DOM ──────────────────────────────────────
  const form = document.getElementById('checkout-form');
  const summaryBody = document.getElementById('checkout-summary-items');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const shippingEl = document.getElementById('checkout-shipping');
  const totalEl = document.getElementById('checkout-total');
  const payBtn = document.getElementById('checkout-pay-btn');
  const payBtnText = document.getElementById('checkout-pay-btn-text');
  const payBtnSpinner = document.getElementById('checkout-pay-btn-spinner');
  const errorEl = document.getElementById('checkout-error');
  const successEl = document.getElementById('checkout-success');
  const formContainer = document.getElementById('checkout-form-container');

  // Envío V1 – tarifa plana
  const SHIPPING_FLAT = 120;
  const SHIPPING_FREE_THRESHOLD = 999;

  // ── Renderizar resumen del pedido ──────────────────────────
  function renderSummary() {
    const cart = getCart();

    if (cart.length === 0) {
      // Mostrar mensaje de carrito vacío en lugar de redirigir
      summaryBody.innerHTML = '<div class="checkout-summary-item" style="justify-content: center; color: var(--muted); padding: 20px 0;">Tu carrito está vacío.</div>';
      subtotalEl.textContent = formatMXN.format(0);
      shippingEl.textContent = formatMXN.format(0);
      totalEl.textContent = formatMXN.format(0);
      payBtnText.textContent = `Pagar $0.00`;
      payBtn.disabled = true;

      // Ocultar o deshabilitar formulario
      Array.from(form.elements).forEach(el => el.disabled = true);
      return;
    }

    let html = '';
    let subtotal = 0;

    cart.forEach((item) => {
      const product = PRODUCT_CATALOG[item.id];
      if (!product) return;

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      html += `
        <div class="checkout-summary-item">
          <div class="checkout-summary-item__info">
            <img src="images/productos/${product.image}" 
                 alt="${product.name}" 
                 class="checkout-summary-item__img" />
            <div>
              <span class="checkout-summary-item__name">${product.name}</span>
              <span class="checkout-summary-item__qty">× ${item.quantity}</span>
            </div>
          </div>
          <span class="checkout-summary-item__price">${formatMXN.format(lineTotal)}</span>
        </div>
      `;
    });

    const shipping = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FLAT;
    const total = subtotal + shipping;

    summaryBody.innerHTML = html;
    subtotalEl.textContent = formatMXN.format(subtotal);
    shippingEl.textContent = shipping === 0 ? 'Gratis' : formatMXN.format(shipping);
    totalEl.textContent = formatMXN.format(total);
    payBtnText.textContent = `Pagar ${formatMXN.format(total)}`;
  }

  // ── Mostrar / ocultar error ────────────────────────────────
  function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideError() {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  // ── Mostrar loading ────────────────────────────────────────
  function setLoading(loading) {
    isProcessing = loading;
    payBtn.disabled = loading;
    payBtnText.style.display = loading ? 'none' : 'inline-flex';
    payBtnSpinner.style.display = loading ? 'inline-flex' : 'none';
  }

  // ── Mostrar éxito ──────────────────────────────────────────
  function showSuccess(orderUid) {
    formContainer.style.display = 'none';
    successEl.style.display = 'flex';

    const uidEl = document.getElementById('success-order-uid');
    if (uidEl && orderUid) {
      uidEl.textContent = orderUid;
    }
  }

  // ── Recopilar datos del formulario ─────────────────────────
  function getFormData() {
    return {
      customer: {
        name: form.elements['customer-name'].value.trim(),
        email: form.elements['customer-email'].value.trim(),
        phone: form.elements['customer-phone'].value.trim(),
      },
      shipping_address: {
        street: form.elements['shipping-street'].value.trim(),
        exterior_number: form.elements['shipping-exterior'].value.trim(),
        interior_number: form.elements['shipping-interior'].value.trim() || '',
        neighborhood: form.elements['shipping-neighborhood'].value.trim(),
        postal_code: form.elements['shipping-postal'].value.trim(),
        city: form.elements['shipping-city'].value.trim(),
        state: form.elements['shipping-state'].value.trim(),
      },
      references: form.elements['shipping-references']
        ? form.elements['shipping-references'].value.trim()
        : '',
    };
  }

  // ── Procesar pago vía backend LFDM ─────────────────────────
  /**
   * Flujo:
   *  1. Validar formulario HTML5
   *  2. POST /api/v1/checkout con ids + cantidades (sin precios)
   *     – El backend valida stock y precios contra la BD
   *     – Crea la orden y el checkout hosted en EcartPay
   *  3. Redirigir al link de pago seguro de EcartPay
   */
  async function processPayment(e) {
    e.preventDefault();

    if (isProcessing) return;
    hideError();

    // Validar formulario nativo HTML5
    if (!form.reportValidity()) return;

    const cart = getCart();
    if (cart.length === 0) {
      showError('Tu carrito está vacío.');
      return;
    }

    setLoading(true);

    try {
      const formData = getFormData();

      const payload = {
        customer: formData.customer,
        shipping_address: formData.shipping_address,
        // Solo ids y cantidades: los precios los fija el servidor
        items: cart.map((item) => ({
          id: Number(item.id),
          quantity: Number(item.quantity),
        })),
      };

      const res = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body.success || !body.data || !body.data.payment_url) {
        const message = Array.isArray(body.errors)
          ? body.errors.join(' ')
          : (body.message || 'No se pudo iniciar el pago. Intenta de nuevo.');
        showError(message);
        return;
      }

      // Redirigir a la página de pago segura de EcartPay.
      // El carrito NO se vacía aquí: si el cliente cancela el pago,
      // conserva sus artículos al volver.
      window.location.href = body.data.payment_url;
    } catch (err) {
      console.error('[CHECKOUT] Error:', err);
      showError('No hay conexión con el servidor de pagos. Intenta de nuevo en unos minutos.');
    } finally {
      setLoading(false);
    }
  }

  // ── Inicialización ─────────────────────────────────────────
  function init() {
    if (!form || !summaryBody) {
      // No estamos en la página de checkout
      return;
    }

    // Retorno tras pago completado (checkout.html?paid=1&order=<uid>):
    // vaciar carrito y mostrar pantalla de éxito.
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1') {
      clearCart();
      showSuccess(params.get('order') || '');
      return;
    }

    renderSummary();

    // Escuchar submit del formulario
    form.addEventListener('submit', processPayment);

    // También el botón de pagar puede disparar el submit
    if (payBtn) {
      payBtn.addEventListener('click', (e) => {
        // Disparar submit del form para que pase por validación HTML5
        form.requestSubmit();
      });
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exponer para acceso externo si se necesita
  window.LFDMCheckout = { init, processPayment };
})();
