/**
 * ═══════════════════════════════════════════════════════════════
 *  Controlador de Webhooks – EcartPay
 *  POST /api/v1/webhooks/ecartpay
 *
 *  Recibe notificaciones asíncronas desde los servidores de
 *  EcartPay y actualiza el estado de la orden.
 *
 *  Autenticación (docs.ecartpay.com/docs/webhook-authentication):
 *    Headers:  x-pay-timestamp, x-pay-webhook-id, x-pay-signature
 *    Firma:    HMAC-SHA256(secret, `${timestamp}.${webhookId}.${JSON.stringify(data)}`)
 *    El header llega con prefijo "SHA256=".
 * ═══════════════════════════════════════════════════════════════
 */

const crypto  = require('crypto');
const Order   = require('../models/order.model');
const Product = require('../models/product.model');
const { pool } = require('../db/connection');

/**
 * Compara la firma recibida contra las firmas candidatas en
 * tiempo constante. EcartPay documenta la base como
 * `{timestamp}.{webhook_id}.{JSON.stringify(data)}`; se aceptan
 * tanto el body completo como su campo `data` para cubrir ambas
 * interpretaciones del payload.
 */
function isValidSignature(req) {
  const secret = process.env.ECARTPAY_WEBHOOK_SECRET;

  if (!secret) {
    // Sin secret configurado: rechazar en producción (fail-closed),
    // permitir en desarrollo/sandbox para pruebas locales.
    if (process.env.NODE_ENV === 'production') {
      console.error('[WEBHOOK] ECARTPAY_WEBHOOK_SECRET no configurado. Rechazando.');
      return false;
    }
    return true;
  }

  const timestamp = req.headers['x-pay-timestamp'];
  const webhookId = req.headers['x-pay-webhook-id'];
  const received  = (req.headers['x-pay-signature'] || '').replace(/^SHA256=/i, '');

  if (!timestamp || !webhookId || !received) return false;

  const candidates = [req.body];
  if (req.body && typeof req.body === 'object' && req.body.data !== undefined) {
    candidates.push(req.body.data);
  }

  let receivedBuf;
  try {
    receivedBuf = Buffer.from(received, 'hex');
  } catch (_e) {
    return false;
  }

  return candidates.some((data) => {
    const base = `${timestamp}.${webhookId}.${JSON.stringify(data)}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(base, 'utf8')
      .digest();

    return receivedBuf.length === expected.length
      && crypto.timingSafeEqual(receivedBuf, expected);
  });
}

/**
 * Handler del webhook de EcartPay.
 *
 *   1. Validar la firma HMAC de la petición.
 *   2. Encontrar la orden interna (por id de checkout o reference).
 *   3. Actualizar el status según el evento.
 *   4. Descontar el stock si el pago fue confirmado.
 *   5. Responder 200 OK.
 */
async function handleWebhook(req, res) {
  try {
    const payload = req.body || {};

    console.log('[WEBHOOK] Notificación recibida:', JSON.stringify(payload));

    // ─── 1. Validación de firma ─────────────────────────────────
    if (!isValidSignature(req)) {
      console.warn('[WEBHOOK] Firma inválida. Rechazando.');
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    // ─── 2. Extraer datos del evento ────────────────────────────
    //  Estructura típica: { event: "...", data: { id, status, reference, … } }
    const data = (payload.data && typeof payload.data === 'object') ? payload.data : payload;

    const transactionId = data.checkout_id || data.order_id || data.id || null;
    const eventStatus   = String(data.status || '').toLowerCase();
    const reference     = data.reference_id || data.reference || null;

    if (!transactionId && !reference) {
      console.warn('[WEBHOOK] Payload sin identificador válido.');
      return res.sendStatus(200); // Responder OK para no recibir reintentos
    }

    // ─── 3. Buscar la orden ─────────────────────────────────────
    let order = null;

    if (transactionId) {
      order = await Order.findByEcartpayTxn(transactionId);
    }

    if (!order && reference) {
      // reference_id lleva el UUID; reference llega como "Orden LFDM <uuid>"
      const uid = String(reference).replace(/^Orden LFDM\s*#?\s*/i, '').trim();
      order = await Order.findByUid(uid);
    }

    if (!order) {
      console.warn('[WEBHOOK] Orden no encontrada para:', { transactionId, reference });
      return res.sendStatus(200);
    }

    // Evitar procesar órdenes que ya están pagadas
    if (order.status === 'paid') {
      console.log('[WEBHOOK] Orden ya pagada, ignorando duplicado.');
      return res.sendStatus(200);
    }

    // ─── 4. Actualizar estado y descontar stock ─────────────────
    if (['paid', 'completed', 'approved', 'success'].includes(eventStatus)) {
      const items = await Order.getItems(order.id);

      // Descontar stock dentro de una transacción
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        for (const item of items) {
          await Product.decrementStock(conn, item.product_id, item.quantity);
        }

        await conn.commit();
      } catch (stockErr) {
        await conn.rollback();
        console.error('[WEBHOOK] Error al descontar stock:', stockErr.message);
        // No devolvemos error a EcartPay; el stock se puede corregir manualmente
      } finally {
        conn.release();
      }

      await Order.updateStatus(order.id, 'paid', transactionId);
      console.log(`[WEBHOOK] Orden ${order.order_uid} marcada como PAID.`);

    } else if (['failed', 'declined', 'rejected'].includes(eventStatus)) {
      await Order.updateStatus(order.id, 'failed', transactionId);
      console.log(`[WEBHOOK] Orden ${order.order_uid} marcada como FAILED.`);

    } else if (['refunded'].includes(eventStatus)) {
      await Order.updateStatus(order.id, 'refunded', transactionId);
      console.log(`[WEBHOOK] Orden ${order.order_uid} marcada como REFUNDED.`);
    }

    // ─── 5. Responder 200 OK ────────────────────────────────────
    return res.sendStatus(200);

  } catch (err) {
    console.error('[WEBHOOK] Error inesperado:', err);
    // Siempre responder 200 para evitar reintentos infinitos
    return res.sendStatus(200);
  }
}

module.exports = { handleWebhook };
