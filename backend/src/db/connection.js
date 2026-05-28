/**
 * ═══════════════════════════════════════════════════════════════
 *  Pool de conexiones MySQL / MariaDB
 *  Usa mysql2/promise para soporte nativo de async/await.
 *  Todas las consultas deben usar parámetros preparados (?)
 *  para prevenir inyecciones SQL.
 * ═══════════════════════════════════════════════════════════════
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  // Configuración del pool
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,

  // Zona horaria coherente con MX
  timezone: '-06:00',

  // Habilitar soporte de múltiples sentencias (solo para migraciones)
  // En producción se usa una conexión individual para migraciones.
  multipleStatements: false,
});

/**
 * Verifica que la BD esté accesible al arrancar el servidor.
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅  Conexión a la base de datos establecida');
    conn.release();
  } catch (err) {
    console.error('❌  No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
