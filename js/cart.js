/**
 * ============================================================
 *  LFDM – Módulo de Estado del Carrito de Compras
 * ============================================================
 *  Gestiona la persistencia del carrito en LocalStorage y
 *  expone funciones puras para manipular los artículos.
 *
 *  Cada mutación despacha el evento personalizado
 *  'cart-updated' en `window` para que el módulo de UI
 *  pueda reaccionar sin acoplamiento directo.
 *
 *  Se expone globalmente como `window.LFDMCart`.
 * ============================================================
 */

(function () {
  'use strict';

  // ── Clave de LocalStorage ──────────────────────────────────
  const CART_KEY = 'lfdm_cart';

  // ── Catálogo de productos (coincide con IDs del backend) ──
  const PRODUCT_CATALOG = {
    1: { sku: 'LFDM-GOTAS-500',     name: 'Gotas LFDM (Suplemento 500 mg)', price: 599.00, image: 'gotas1.webp' },
    10:{ sku: 'LFDM-GOTAS-300',     name: 'Gotas LFDM (Suplemento 300 mg)', price: 399.00, image: 'gotas1.webp' },
    11:{ sku: 'LFDM-GOTAS-ISO',     name: 'Gotas LFDM (Isolated 300 mg)',   price: 300.00, image: 'gotas3.webp' },
    2: { sku: 'LFDM-CREMA-001',     name: 'Crema Facial Nocturna',          price: 499.00, image: 'cremaFacial1.webp' },
    3: { sku: 'LFDM-COLAGENO-001',  name: 'CBD Collagen',              price: 449.00, image: 'colageno1.webp' },
    4: { sku: 'LFDM-ALMOHADA-001',  name: 'Almohada Terapéutica',      price: 399.00, image: 'almohada1.webp' },
    5: { sku: 'LFDM-POMADA-001',    name: 'Pomada / Bálsamo Corporal', price: 349.00, image: 'pomada1.webp' },
    6: { sku: 'LFDM-SHAMPOO-001',   name: 'Shampoo LFDM',              price: 299.00, image: 'shampoo1.webp' },
    7: { sku: 'LFDM-VELA-001',      name: 'Vela Aromática',            price: 279.00, image: 'velas1.webp' },
    8: { sku: 'LFDM-GEL-001',       name: 'Gel Íntimo',                price: 329.00, image: 'gelIntimo1.webp' },
    9: { sku: 'LFDM-DESINF-001',    name: 'Desinfectante',             price: 149.00, image: 'desinfectante1.webp' },
  };

  // ── Helpers internos ───────────────────────────────────────

  /**
   * Notifica a toda la aplicación que el carrito cambió.
   * Cualquier módulo de UI puede escuchar este evento con:
   *   window.addEventListener('cart-updated', callback);
   */
  function _emitCartUpdated() {
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }

  /**
   * Guarda el arreglo del carrito en LocalStorage.
   * @param {Array} cart - Arreglo de objetos { productId, quantity }.
   */
  function _saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // ── API pública ────────────────────────────────────────────

  /**
   * Obtiene el carrito actual desde LocalStorage.
   * @returns {Array} Arreglo de objetos { id: number, quantity: number }.
   *                  Regresa un arreglo vacío si no existe o si los datos
   *                  almacenados están corruptos.
   */
  function getCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch (_error) {
      // Si el JSON está corrupto, reiniciamos el carrito
      return [];
    }
  }

  /**
   * Agrega un producto al carrito o incrementa su cantidad
   * si ya existe.
   * @param {number} productId - ID numérico del producto (debe existir en PRODUCT_CATALOG).
   * @param {number} quantity  - Cantidad a agregar (por defecto 1).
   */
  function addToCart(productId, quantity) {
    // Aseguramos tipos numéricos
    productId = Number(productId);
    quantity  = Number(quantity) || 1;

    // Validamos que el producto exista en el catálogo
    if (!PRODUCT_CATALOG[productId]) {
      console.warn(`[LFDMCart] Producto con ID ${productId} no encontrado en el catálogo.`);
      return;
    }

    const cart = getCart();
    const existing = cart.find(function (item) {
      return item.id === productId;
    });

    if (existing) {
      // Si ya está en el carrito, sumamos la cantidad
      existing.quantity += quantity;
    } else {
      // Si no existe, lo agregamos como nuevo artículo
      cart.push({ id: productId, quantity: quantity });
    }

    _saveCart(cart);
    _emitCartUpdated();
  }

  /**
   * Elimina un producto del carrito por completo.
   * @param {number} productId - ID numérico del producto a eliminar.
   */
  function removeFromCart(productId) {
    productId = Number(productId);

    const cart = getCart().filter(function (item) {
      return item.id !== productId;
    });

    _saveCart(cart);
    _emitCartUpdated();
  }

  /**
   * Establece la cantidad exacta de un producto.
   * Si la cantidad es menor o igual a 0, el producto se elimina.
   * @param {number} productId - ID numérico del producto.
   * @param {number} quantity  - Nueva cantidad deseada.
   */
  function updateQuantity(productId, quantity) {
    productId = Number(productId);
    quantity  = Number(quantity);

    // Si la cantidad no es válida o es ≤ 0, eliminamos el producto
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const cart = getCart();
    const existing = cart.find(function (item) {
      return item.id === productId;
    });

    if (existing) {
      existing.quantity = quantity;
    } else {
      // Si el producto no estaba, lo agregamos con la cantidad indicada
      cart.push({ id: productId, quantity: quantity });
    }

    _saveCart(cart);
    _emitCartUpdated();
  }

  /**
   * Vacía el carrito por completo.
   */
  function clearCart() {
    _saveCart([]);
    _emitCartUpdated();
  }

  /**
   * Calcula el número total de artículos en el carrito
   * (sumando las cantidades de cada línea).
   * @returns {number} Cantidad total de artículos.
   */
  function getCartCount() {
    return getCart().reduce(function (total, item) {
      return total + item.quantity;
    }, 0);
  }

  /**
   * Calcula el subtotal del carrito multiplicando la cantidad
   * de cada artículo por su precio en el catálogo.
   * Productos que ya no existan en el catálogo se ignoran.
   * @returns {number} Subtotal en MXN.
   */
  function getCartSubtotal() {
    return getCart().reduce(function (subtotal, item) {
      var product = PRODUCT_CATALOG[item.id];
      if (product) {
        return subtotal + (product.price * item.quantity);
      }
      return subtotal;
    }, 0);
  }

  // ── Exposición global ──────────────────────────────────────
  window.LFDMCart = {
    PRODUCT_CATALOG:  PRODUCT_CATALOG,
    getCart:          getCart,
    addToCart:        addToCart,
    removeFromCart:   removeFromCart,
    updateQuantity:   updateQuantity,
    clearCart:        clearCart,
    getCartCount:     getCartCount,
    getCartSubtotal:  getCartSubtotal,
  };
})();
