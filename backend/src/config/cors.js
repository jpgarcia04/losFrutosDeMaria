/**
 * ═══════════════════════════════════════════════════════════════
 *  Configuración CORS
 *  Solo acepta escritura (POST) desde el dominio de producción
 *  en GitHub Pages y desde localhost en desarrollo.
 * ═══════════════════════════════════════════════════════════════
 */

// Orígenes permitidos
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,         // p.ej. https://tu-usuario.github.io
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:5500',              // Live Server (VS Code)
  'http://127.0.0.1',
  'http://127.0.0.1:5500',
];

const corsOptions = {
  /**
   * Función de validación dinámica del origen.
   * Permite peticiones sin origen (herramientas CLI, Postman)
   * solo en entorno de desarrollo.
   */
  origin(origin, callback) {
    // Permitir peticiones sin origen (server-to-server, curl, Postman)
    // solo en desarrollo
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },

  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // pre-flight cache: 24 h
};

module.exports = corsOptions;
