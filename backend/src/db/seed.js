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

// Los IDs son explícitos: deben coincidir con PRODUCT_CATALOG
// de js/cart.js en el frontend.
const PRODUCTS = [
  { id: 1,  sku: 'LFDM-GOTAS-500',     name: 'Gotas LFDM (Suplemento 500 mg)', price: 599.00, stock: 100 },
  { id: 2,  sku: 'LFDM-CREMA-001',     name: 'Crema Facial Nocturna',          price: 499.00, stock: 80  },
  { id: 3,  sku: 'LFDM-COLAGENO-001',  name: 'CBD Collagen',                   price: 449.00, stock: 60  },
  { id: 4,  sku: 'LFDM-ALMOHADA-001',  name: 'Almohada Terapéutica',           price: 399.00, stock: 50  },
  { id: 5,  sku: 'LFDM-POMADA-001',    name: 'Pomada / Bálsamo Corporal',      price: 349.00, stock: 70  },
  { id: 6,  sku: 'LFDM-SHAMPOO-001',   name: 'Shampoo LFDM',                   price: 299.00, stock: 90  },
  { id: 7,  sku: 'LFDM-VELA-001',      name: 'Vela Aromática',                 price: 279.00, stock: 120 },
  { id: 8,  sku: 'LFDM-GEL-001',       name: 'Gel Íntimo',                     price: 329.00, stock: 60  },
  { id: 9,  sku: 'LFDM-DESINF-001',    name: 'Desinfectante',                  price: 149.00, stock: 150 },
  { id: 10, sku: 'LFDM-GOTAS-300',     name: 'Gotas LFDM (Suplemento 300 mg)', price: 399.00, stock: 100 },
  { id: 11, sku: 'LFDM-GOTAS-ISO',     name: 'Gotas LFDM (Isolated 300 mg)',   price: 300.00, stock: 100 },
];

(async () => {
  try {
    // Verificar si ya hay productos
    const [existing] = await pool.execute('SELECT COUNT(*) as total FROM products');
    if (existing[0].total > 0) {
      console.log('ℹ️  La tabla products ya tiene datos. Seed omitido.');
      process.exit(0);
    }

    // Insertar productos (con ID explícito para coincidir con el frontend)
    for (const p of PRODUCTS) {
      await pool.execute(
        'INSERT INTO products (id, sku, name, price, stock) VALUES (?, ?, ?, ?, ?)',
        [p.id, p.sku, p.name, p.price, p.stock],
      );
    }

    console.log(`✅  ${PRODUCTS.length} productos insertados correctamente.`);
    process.exit(0);
  } catch (err) {
    console.error('❌  Error en el seed:', err.message);
    process.exit(1);
  }
})();
