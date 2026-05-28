/**
 * ═══════════════════════════════════════════════════════════════
 *  Script de migración – Crea las tablas del esquema e-commerce
 *
 *  Ejecutar con:  npm run migrate
 *
 *  Nota: usa multipleStatements para ejecutar todo el DDL de
 *        una sola vez.  Solo debe usarse en este script.
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DDL = `
-- ═══════════════════════════════════════════════════════════════
--  TABLA: products
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  sku         VARCHAR(50)       NOT NULL UNIQUE,
  name        VARCHAR(255)      NOT NULL,
  price       DECIMAL(10, 2)    NOT NULL CHECK (price >= 0),
  stock       INT UNSIGNED      NOT NULL DEFAULT 0,
  created_at  TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
--  TABLA: orders
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id                        INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  order_uid                 VARCHAR(36)       NOT NULL UNIQUE COMMENT 'UUID público de la orden',
  customer_name             VARCHAR(255)      NOT NULL,
  customer_email            VARCHAR(255)      NOT NULL,
  phone                     VARCHAR(20)       NOT NULL,
  subtotal                  DECIMAL(10, 2)    NOT NULL,
  shipping_cost             DECIMAL(10, 2)    NOT NULL DEFAULT 0.00,
  total_amount              DECIMAL(10, 2)    NOT NULL,
  status                    ENUM('pending','processing','paid','failed','refunded','cancelled')
                            NOT NULL DEFAULT 'pending',
  ecartpay_transaction_id   VARCHAR(255)      DEFAULT NULL,
  created_at                TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status          (status),
  INDEX idx_ecartpay_txn    (ecartpay_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
--  TABLA: order_shipping
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_shipping (
  id                INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  order_id          INT UNSIGNED      NOT NULL,
  street            VARCHAR(255)      NOT NULL,
  exterior_number   VARCHAR(20)       NOT NULL,
  interior_number   VARCHAR(20)       DEFAULT NULL,
  neighborhood      VARCHAR(255)      NOT NULL,
  postal_code       VARCHAR(10)       NOT NULL,
  city              VARCHAR(100)      NOT NULL,
  state             VARCHAR(100)      NOT NULL,

  CONSTRAINT fk_shipping_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
--  TABLA: order_items
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_items (
  id                INT UNSIGNED      AUTO_INCREMENT PRIMARY KEY,
  order_id          INT UNSIGNED      NOT NULL,
  product_id        INT UNSIGNED      NOT NULL,
  quantity          INT UNSIGNED      NOT NULL CHECK (quantity > 0),
  price_at_purchase DECIMAL(10, 2)    NOT NULL,

  CONSTRAINT fk_item_order
    FOREIGN KEY (order_id)   REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_item_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

(async () => {
  let connection;
  try {
    // Conexión individual con multipleStatements habilitado
    connection = await mysql.createConnection({
      host:               process.env.DB_HOST || '127.0.0.1',
      port:               Number(process.env.DB_PORT) || 3306,
      user:               process.env.DB_USER,
      password:           process.env.DB_PASS,
      database:           process.env.DB_NAME,
      multipleStatements: true,
    });

    console.log('⏳  Ejecutando migraciones…');
    await connection.query(DDL);
    console.log('✅  Tablas creadas correctamente.');
  } catch (err) {
    console.error('❌  Error en la migración:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
})();
