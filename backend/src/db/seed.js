/**
 * ═══════════════════════════════════════════════════════════════
 *  Seed de productos – Carga inicial de datos de ejemplo
 *
 *  Ejecutar con:  node src/db/seed.js
 *
 *  Inserta los productos del catálogo de Los Frutos de María
 *  si la tabla `products` está vacía.
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const { pool } = require('./connection');

const PRODUCTS = [
  { sku: 'LFDM-GOTAS-001',      name: 'Gotas LFDM',              price: 599.00, stock: 100 },
  { sku: 'LFDM-CREMA-001',      name: 'Crema Facial Nocturna',    price: 499.00, stock: 80  },
  { sku: 'LFDM-COLAGENO-001',   name: 'CBD Collagen',             price: 449.00, stock: 60  },
  { sku: 'LFDM-ALMOHADA-001',   name: 'Almohada Terapéutica',     price: 399.00, stock: 50  },
  { sku: 'LFDM-POMADA-001',     name: 'Pomada / Bálsamo Corporal', price: 349.00, stock: 70  },
  { sku: 'LFDM-SHAMPOO-001',    name: 'Shampoo LFDM',             price: 299.00, stock: 90  },
  { sku: 'LFDM-VELA-001',       name: 'Vela Aromática',            price: 279.00, stock: 120 },
  { sku: 'LFDM-GEL-001',        name: 'Gel Íntimo',                price: 329.00, stock: 60  },
  { sku: 'LFDM-DESINF-001',     name: 'Desinfectante',             price: 149.00, stock: 150 },
];

(async () => {
  try {
    // Verificar si ya hay productos
    const [existing] = await pool.execute('SELECT COUNT(*) as total FROM products');
    if (existing[0].total > 0) {
      console.log('ℹ️  La tabla products ya tiene datos. Seed omitido.');
      process.exit(0);
    }

    // Insertar productos
    for (const p of PRODUCTS) {
      await pool.execute(
        'INSERT INTO products (sku, name, price, stock) VALUES (?, ?, ?, ?)',
        [p.sku, p.name, p.price, p.stock],
      );
    }

    console.log(`✅  ${PRODUCTS.length} productos insertados correctamente.`);
    process.exit(0);
  } catch (err) {
    console.error('❌  Error en el seed:', err.message);
    process.exit(1);
  }
})();
