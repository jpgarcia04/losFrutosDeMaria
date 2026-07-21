/**
 * ═══════════════════════════════════════════════════════════════
 *  Router principal – /api/v1
 *  Agrupa todas las sub-rutas de la API.
 * ═══════════════════════════════════════════════════════════════
 */

const { Router }          = require('express');
const rateLimit            = require('express-rate-limit');
const { validateCheckout } = require('../middleware/validate');
const { checkout }         = require('../controllers/checkout.controller');
const { handleWebhook }    = require('../controllers/webhook.controller');

const router = Router();

// ── Rate limiter para checkout (anti-abuso) ─────────────────────
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max:      30,               // máx. 30 intentos por IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Demasiados intentos de compra. Intente de nuevo en 15 minutos.',
  },
});

// ── Endpoints ───────────────────────────────────────────────────

/**
 * POST /api/v1/checkout
 * Motor de la transacción: valida stock, calcula totales,
 * crea la orden y cobra en EcartPay.
 */
router.post('/checkout', checkoutLimiter, validateCheckout, checkout);

/**
 * POST /api/v1/webhooks/ecartpay
 * Recepción asíncrona de notificaciones de EcartPay.
 */
router.post('/webhooks/ecartpay', handleWebhook);

module.exports = router;
