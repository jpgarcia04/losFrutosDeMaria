/**
 * ═══════════════════════════════════════════════════════════════
 *  Controlador de Checkout
 *  POST /api/v1/checkout
 *
 *  Flujo completo:
 *    1. Obtener precios reales y verificar stock
 *    2. Calcular subtotal y costo de envío
 *    3. Insertar la orden (transacción SQL)
 *    4. Enviar cargo a EcartPay
 *    5. Retornar resultado al frontend
 * ═══════════════════════════════════════════════════════════════
 */

const { v4: uuidv4 } = require('uuid');
const Product   = require('../models/product.model');
const Order     = require('../models/order.model');
const ecartpay  = require('../services/ecartpay.service');

// ── Constantes de envío (V1 – tarifa plana) ─────────────────────
const SHIPPING_FLAT_RATE     = Number(process.env.SHIPPING_FLAT_RATE)     || 120;
const SHIPPING_FREE_THRESHOLD = Number(process.env.SHIPPING_FREE_THRESHOLD) || 999;

/**
 * Calcula el costo de envío según el subtotal.
 * V1: tarifa plana o gratis si supera el umbral.
 */
function calculateShipping(subtotal) {
  return subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
}

/**
 * Handler principal del checkout.
 */
async function checkout(req, res) {
  try {
    const { customer, shipping_address, items } = req.body;

    // ─── 1. Obtener precios reales y verificar stock ────────────
    const productIds = items.map((i) => i.id);
    const products   = await Product.findByIds(productIds);

    // Crear un mapa id → producto para búsqueda rápida
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validar que todos los productos existan y tengan stock
    const enrichedItems = [];
    const stockErrors   = [];

    for (const item of items) {
      const product = productMap.get(item.id);

      if (!product) {
        stockErrors.push(`Producto con ID ${item.id} no encontrado.`);
        continue;
      }

      if (product.stock < item.quantity) {
        stockErrors.push(
          `Stock insuficiente para "${product.name}": disponible ${product.stock}, solicitado ${item.quantity}.`,
        );
        continue;
      }

      enrichedItems.push({
        productId:       product.id,
        quantity:         item.quantity,
        priceAtPurchase:  Number(product.price),
        name:             product.name,
      });
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({ success: false, errors: stockErrors });
    }

    // ─── 2. Calcular subtotal y envío ───────────────────────────
    const subtotal     = enrichedItems.reduce(
      (sum, i) => sum + i.priceAtPurchase * i.quantity,
      0,
    );
    const shippingCost = calculateShipping(subtotal);
    const totalAmount  = subtotal + shippingCost;

    // ─── 3. Insertar la orden (transacción SQL) ─────────────────
    const orderUid = uuidv4();

    const { orderId } = await Order.createWithTransaction({
      orderUid,
      customer: {
        name:  customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      subtotal,
      shippingCost,
      totalAmount,
      items: enrichedItems,
      shipping: shipping_address,
    });

    // ─── 4. Crear Checkout hosted en EcartPay ───────────────────
    //  El monto lo fija el servidor; el cliente paga en la página
    //  segura de EcartPay y la confirmación llega por webhook.
    let ecartpayCheckout;
    try {
      const backendUrl = process.env.BACKEND_PUBLIC_URL || 'https://bj-api.site';

      const checkoutItems = enrichedItems.map((i) => ({
        name:     i.name,
        price:    i.priceAtPurchase,
        quantity: i.quantity,
      }));

      if (shippingCost > 0) {
        checkoutItems.push({ name: 'Envío estándar', price: shippingCost, quantity: 1 });
      }

      ecartpayCheckout = await ecartpay.createCheckout({
        total:     totalAmount,
        concept:   `Orden LFDM #${orderUid}`,
        orderUid,
        items:     checkoutItems,
        notifyUrl: `${backendUrl}/api/v1/webhooks/ecartpay`,
      });

      // Guardar el ID del checkout de EcartPay para conciliar el webhook
      await Order.updateStatus(orderId, 'processing', ecartpayCheckout.id || null);
    } catch (payErr) {
      console.error('[CHECKOUT] Error en EcartPay:', payErr.message);
      await Order.updateStatus(orderId, 'failed');

      return res.status(502).json({
        success: false,
        message: 'No se pudo iniciar el pago. Intente de nuevo en unos minutos.',
        order_uid: orderUid,
      });
    }

    // ─── 5. Respuesta exitosa: el frontend redirige al link ─────
    return res.status(201).json({
      success: true,
      message: 'Orden creada. Redirigiendo al pago…',
      data: {
        order_uid:     orderUid,
        subtotal,
        shipping_cost: shippingCost,
        total_amount:  totalAmount,
        status:        'processing',
        payment_url:   ecartpayCheckout.link,
      },
    });
  } catch (err) {
    console.error('[CHECKOUT] Error inesperado:', err);
    return res.status(500).json({
      success: false,
      message: 'Error interno al procesar la orden.',
    });
  }
}

module.exports = { checkout };
