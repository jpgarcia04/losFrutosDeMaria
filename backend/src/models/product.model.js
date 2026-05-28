/**
 * ═══════════════════════════════════════════════════════════════
 *  Modelo de Productos
 *  Consultas parametrizadas contra la tabla `products`.
 * ═══════════════════════════════════════════════════════════════
 */

const { pool } = require('../db/connection');

const Product = {
  /**
   * Busca un producto por su ID.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, sku, name, price, stock FROM products WHERE id = ?',
      [id],
    );
    return rows[0] || null;
  },

  /**
   * Busca múltiples productos por sus IDs.
   * @param {number[]} ids
   * @returns {Promise<object[]>}
   */
  async findByIds(ids) {
    if (!ids.length) return [];
    // Construir placeholders dinámicos de forma segura
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await pool.execute(
      `SELECT id, sku, name, price, stock FROM products WHERE id IN (${placeholders})`,
      ids,
    );
    return rows;
  },

  /**
   * Descuenta stock de un producto (dentro de una transacción).
   * @param {import('mysql2/promise').Connection} conn  Conexión transaccional
   * @param {number} productId
   * @param {number} quantity
   */
  async decrementStock(conn, productId, quantity) {
    await conn.execute(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
      [quantity, productId, quantity],
    );
  },
};

module.exports = Product;
