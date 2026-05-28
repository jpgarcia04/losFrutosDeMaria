/**
 * ═══════════════════════════════════════════════════════════════
 *  Modelo de Órdenes
 *  Operaciones CRUD y transaccionales contra las tablas
 *  `orders`, `order_items` y `order_shipping`.
 * ═══════════════════════════════════════════════════════════════
 */

const { pool } = require('../db/connection');

const Order = {
  /**
   * Crea una orden completa dentro de una transacción SQL.
   * Si algo falla se hace rollback automático.
   *
   * @param {object}   data
   * @param {string}   data.orderUid       UUID público
   * @param {object}   data.customer       { name, email, phone }
   * @param {number}   data.subtotal
   * @param {number}   data.shippingCost
   * @param {number}   data.totalAmount
   * @param {object[]} data.items          [{ productId, quantity, priceAtPurchase }]
   * @param {object}   data.shipping       { street, exterior_number, … }
   * @returns {Promise<{ orderId: number, orderUid: string }>}
   */
  async createWithTransaction(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1) Insertar la orden
      const [orderResult] = await conn.execute(
        `INSERT INTO orders
           (order_uid, customer_name, customer_email, phone,
            subtotal, shipping_cost, total_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          data.orderUid,
          data.customer.name,
          data.customer.email,
          data.customer.phone,
          data.subtotal,
          data.shippingCost,
          data.totalAmount,
        ],
      );
      const orderId = orderResult.insertId;

      // 2) Insertar los ítems
      for (const item of data.items) {
        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, item.priceAtPurchase],
        );
      }

      // 3) Insertar la dirección de envío
      const s = data.shipping;
      await conn.execute(
        `INSERT INTO order_shipping
           (order_id, street, exterior_number, interior_number,
            neighborhood, postal_code, city, state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          s.street,
          s.exterior_number,
          s.interior_number || null,
          s.neighborhood,
          s.postal_code,
          s.city,
          s.state,
        ],
      );

      await conn.commit();
      return { orderId, orderUid: data.orderUid };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  /**
   * Actualiza el estatus y el transaction_id de EcartPay.
   * @param {number} orderId
   * @param {string} status
   * @param {string|null} ecartpayTxnId
   */
  async updateStatus(orderId, status, ecartpayTxnId = null) {
    await pool.execute(
      `UPDATE orders
         SET status = ?, ecartpay_transaction_id = COALESCE(?, ecartpay_transaction_id)
       WHERE id = ?`,
      [status, ecartpayTxnId, orderId],
    );
  },

  /**
   * Busca una orden por su UUID público.
   * @param {string} orderUid
   * @returns {Promise<object|null>}
   */
  async findByUid(orderUid) {
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE order_uid = ?',
      [orderUid],
    );
    return rows[0] || null;
  },

  /**
   * Busca una orden por el transaction_id de EcartPay.
   * @param {string} txnId
   * @returns {Promise<object|null>}
   */
  async findByEcartpayTxn(txnId) {
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE ecartpay_transaction_id = ?',
      [txnId],
    );
    return rows[0] || null;
  },

  /**
   * Obtiene los ítems de una orden.
   * @param {number} orderId
   * @returns {Promise<object[]>}
   */
  async getItems(orderId) {
    const [rows] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId],
    );
    return rows;
  },
};

module.exports = Order;
