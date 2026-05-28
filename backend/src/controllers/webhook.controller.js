/**
 * ═══════════════════════════════════════════════════════════════
 *  Controlador de Webhooks – EcartPay
 *  POST /api/v1/webhooks/ecartpay
 *
 *  Recibe notificaciones asíncronas desde los servidores de
 *  EcartPay y actualiza el estado de la orden.
 * ═══════════════════════════════════════════════════════════════
 */

const Order   = require('../models/order.model');
const Product = require('../models/product.model');
const { pool } = require('../db/connection');

/**
 * Handler del webhook de EcartPay.
 *
 * EcartPay envía un POST con datos sobre el estado de la
 * transacción.  Debemos:
 *   1. Validar la legitimidad de la petición.
 *   2. Encontrar la orden interna.
 *   3. Actualizar el status a 'paid'.
 *   4. Descontar el stock.
 *   5. Responder 200 OK inmediatamente.
 */
async function handleWebhook(req, res) {
  try {
    const payload = req.body;

    console.log('[WEBHOOK] Notificación recibida:', JSON.stringify(payload));

    // ─── 1. Validación de origen ────────────────────────────────
    // EcartPay puede enviar un header con la secret key o firma.
    // Aquí validamos que el header de autenticación coincida
    // con nuestra clave secreta (adaptar según documentación
    // actual de webhooks de EcartPay).
    const webhookSecret = req.headers['x-ecartpay-signature']
      || req.headers['authorization']
      || null;

    if (
      process.env.NODE_ENV === 'production' &&
      webhookSecret !== process.env.ECARTPAY_SECRET_KEY
    ) {
      console.warn('[WEBHOOK] Firma inválida. Rechazando.');
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    // ─── 2. Extraer datos del webhook ───────────────────────────
    const transactionId = payload.transaction_id
      || payload.id
      || payload.order_id
      || null;

    const eventStatus = (payload.status || '').toLowerCase();
    const reference   = payload.reference || null;

    if (!transactionId && !reference) {
      console.warn('[WEBHOOK] Payload sin identificador válido.');
      return res.sendStatus(200); // Responder OK para no recibir reintentos
    }

    // ─── 3. Buscar la orden ─────────────────────────────────────
    let order = null;

    if (transactionId) {
      order = await Order.findByEcartpayTxn(transactionId);
    }

    // Si no la encontramos por txn_id, intentar por reference (UUID)
    if (!order && reference) {
      order = await Order.findByUid(reference);
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
      // Obtener los ítems de la orden
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

      // Marcar la orden como pagada
      await Order.updateStatus(order.id, 'paid', transactionId);
      console.log(`[WEBHOOK] Orden ${order.order_uid} marcada como PAID.`);

    } else if (['failed', 'declined', 'rejected'].includes(eventStatus)) {
      await Order.updateStatus(order.id, 'failed', transactionId);
      console.log(`[WEBHOOK] Orden ${order.order_uid} marcada como FAILED.`);

    } else if (['refunded'].includes(eventStatus)) {
      await Order.updateStatus(order.id, 'refunded', transactionId);
      console.log(`[WEBHOOK] Orden ${order.order_uid} marcada como REFUNDED.`);
    }

    // ─── 5. Responder 200 OK inmediato ──────────────────────────
    return res.sendStatus(200);

  } catch (err) {
    console.error('[WEBHOOK] Error inesperado:', err);
    // Siempre responder 200 para evitar reintentos infinitos
    return res.sendStatus(200);
  }
}

module.exports = { handleWebhook };
