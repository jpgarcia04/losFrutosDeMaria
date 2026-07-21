/**
 * ═══════════════════════════════════════════════════════════════
 *  Middleware de validación para el checkout
 *  Verifica la estructura y tipos del payload antes de que
 *  llegue al controlador.
 * ═══════════════════════════════════════════════════════════════
 */

function validateCheckout(req, res, next) {
  const { customer, shipping_address, items } = req.body;
  const errors = [];

  // ── customer ──────────────────────────────────────────────────
  if (!customer || typeof customer !== 'object') {
    errors.push('customer es obligatorio y debe ser un objeto.');
  } else {
    if (!customer.name || typeof customer.name !== 'string') {
      errors.push('customer.name es obligatorio.');
    }
    if (!customer.email || !isValidEmail(customer.email)) {
      errors.push('customer.email debe ser un correo válido.');
    }
    if (!customer.phone || typeof customer.phone !== 'string') {
      errors.push('customer.phone es obligatorio.');
    }
  }

  // ── shipping_address ──────────────────────────────────────────
  if (!shipping_address || typeof shipping_address !== 'object') {
    errors.push('shipping_address es obligatorio y debe ser un objeto.');
  } else {
    const required = ['street', 'exterior_number', 'neighborhood', 'postal_code', 'city', 'state'];
    for (const field of required) {
      if (!shipping_address[field] || typeof shipping_address[field] !== 'string') {
        errors.push(`shipping_address.${field} es obligatorio.`);
      }
    }
  }

  // ── items ─────────────────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0) {
    errors.push('items debe ser un arreglo con al menos un elemento.');
  } else {
    items.forEach((item, idx) => {
      if (!item.id || !Number.isInteger(item.id) || item.id <= 0) {
        errors.push(`items[${idx}].id debe ser un entero positivo.`);
      }
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        errors.push(`items[${idx}].quantity debe ser un entero positivo.`);
      }
    });
  }

  // ── Resultado ─────────────────────────────────────────────────
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

/**
 * Validación simple de email.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = { validateCheckout };
