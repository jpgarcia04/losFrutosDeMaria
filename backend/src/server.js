/**
 * ═══════════════════════════════════════════════════════════════
 *  LFDM Backend – Punto de entrada
 *  API intermediaria: frontend estático ↔ EcartPay
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const morgan  = require('morgan');
const cors    = require('cors');

const corsOptions       = require('./config/cors');
const { testConnection } = require('./db/connection');
const apiRoutes         = require('./routes');

// ── App ─────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// Detrás de Nginx: confiar en el primer proxy para X-Forwarded-*
// (requerido por express-rate-limit para identificar la IP real)
app.set('trust proxy', 1);

// ── Middlewares globales ────────────────────────────────────────
app.use(helmet());                         // Cabeceras de seguridad
app.use(cors(corsOptions));                // CORS estricto
app.use(morgan('combined'));               // Logging HTTP
app.use(express.json({ limit: '1mb' }));   // Parser JSON con límite

// ── Rutas ───────────────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ── Health check ────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 catch-all ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Recurso no encontrado' });
});

// ── Manejador global de errores ─────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
});

// ── Arranque ────────────────────────────────────────────────────
(async () => {
  // Verificar conexión a la BD al iniciar
  await testConnection();

  app.listen(PORT, () => {
    console.log(`\n🚀  LFDM API corriendo en http://localhost:${PORT}`);
    console.log(`    Entorno: ${process.env.NODE_ENV || 'development'}\n`);
  });
})();
