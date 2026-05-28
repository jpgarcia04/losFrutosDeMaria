/**
 * ═══════════════════════════════════════════════════════════════
 *  Checkout – Integración EcartPay SDK + Envío de Payload
 *
 *  Fase 4 y 5: Tokenización frontend + orquestación del pago.
 *  Depende de: cart.js (window.LFDMCart)
 *  SDK:        https://sandbox.ecartpay.com/sdk/pay.js
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ── Configuración ───────────────────────────────────────────
  // TODO: Cambiar a la URL de producción cuando esté listo
  const API_BASE_URL = 'http://localhost:3000/api/v1';

  // Llave pública de EcartPay (sandbox)
  // TODO: Reemplazar con tu publicID real de producción
  const ECARTPAY_PUBLIC_ID = 'pub6180483beab9d945a86da3bf';

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

  // ── Procesar pago con EcartPay SDK ─────────────────────────
  /**
   * Flujo:
   *  1. Validar formulario HTML5
   *  2. Lanzar Pay.Checkout.create() del SDK de EcartPay
   *     – El SDK abre su propio modal/iframe seguro
   *     – Maneja tokenización internamente
   *  3. Al completarse, enviar datos al backend
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

      // Construir items para EcartPay
      const ecartpayItems = cart.map((item) => {
        const product = PRODUCT_CATALOG[item.id];
        return {
          name: product ? product.name : `Producto #${item.id}`,
          price: product ? product.price : 0,
          quantity: item.quantity,
        };
      });

      // Calcular subtotal para determinar envío
      const subtotal = cart.reduce((sum, item) => {
        const product = PRODUCT_CATALOG[item.id];
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);

      const shipping = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FLAT;

      // Agregar costo de envío como ítem si aplica
      if (shipping > 0) {
        ecartpayItems.push({
          name: 'Envío estándar',
          price: shipping,
          quantity: 1,
        });
      }

      // Llamar al SDK de EcartPay – abre checkout modal
      await Pay.Checkout.create({
        publicID: ECARTPAY_PUBLIC_ID,
        order: {
          email: formData.customer.email,
          first_name: formData.customer.name.split(' ')[0],
          last_name: formData.customer.name.split(' ').slice(1).join(' ') || '',
          phone: formData.customer.phone,
          currency: 'MXN',
          items: ecartpayItems,
          shipping_address: {
            first_name: formData.customer.name.split(' ')[0],
            last_name: formData.customer.name.split(' ').slice(1).join(' ') || '',
            address1: `${formData.shipping_address.street} ${formData.shipping_address.exterior_number}`,
            address2: formData.shipping_address.interior_number || '',
            country: {
              code: 'MX',
              name: 'Mexico',
            },
            state: {
              code: formData.shipping_address.state.substring(0, 3).toUpperCase(),
              name: formData.shipping_address.state,
            },
            city: formData.shipping_address.city,
            postal_code: formData.shipping_address.postal_code,
          },
        },
      });

      // Si Pay.Checkout.create() se resuelve sin error,
      // el pago fue procesado por EcartPay directamente.
      // Limpiar carrito y mostrar éxito.
      clearCart();
      showSuccess();
    } catch (err) {
      console.error('[CHECKOUT] Error:', err);

      if (err && err.message) {
        showError(`Error al procesar el pago: ${err.message}`);
      } else {
        showError(
          'No se pudo completar el pago. Verifica los datos de tu tarjeta e intenta de nuevo.',
        );
      }
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
