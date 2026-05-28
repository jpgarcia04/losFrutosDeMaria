/**
 * ═══════════════════════════════════════════════════════════════
 *  Servicio EcartPay
 *  Encapsula toda la comunicación con la pasarela de pagos.
 *  Usa la API nativa `fetch` de Node 18+ (sin dependencias extra).
 * ═══════════════════════════════════════════════════════════════
 */

const ECARTPAY_API_URL  = process.env.ECARTPAY_API_URL || 'https://sandbox.ecartpay.com/api';
const ECARTPAY_SECRET   = process.env.ECARTPAY_SECRET_KEY;

/**
 * Cache básico para el token de autorización.
 * EcartPay devuelve tokens con expiración; aquí se renueva
 * automáticamente si caduca (o si aún no se ha solicitado).
 */
let authCache = { token: null, expiresAt: 0 };

/**
 * Obtiene (o renueva) el token de autorización de EcartPay.
 * Endpoint: POST /api/authorizations/token
 * @returns {Promise<string>} Bearer token
 */
async function getAuthToken() {
  const now = Date.now();

  // Reusar token válido (con 60 s de margen)
  if (authCache.token && authCache.expiresAt > now + 60_000) {
    return authCache.token;
  }

  const res = await fetch(`${ECARTPAY_API_URL}/authorizations/token`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': ECARTPAY_SECRET,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EcartPay auth falló (${res.status}): ${body}`);
  }

  const data = await res.json();

  // Guardar en cache (asumimos 1 h si no viene expires_in)
  authCache = {
    token:     data.token || data.access_token,
    expiresAt: now + ((data.expires_in || 3600) * 1000),
  };

  return authCache.token;
}

/**
 * Crea una orden/cargo en EcartPay.
 * Endpoint: POST /api/orders
 *
 * @param {object} params
 * @param {string} params.tokenId      Token de tarjeta generado en el frontend
 * @param {number} params.amount       Monto total en MXN (decimal)
 * @param {string} params.description  Descripción del cargo
 * @param {string} params.orderUid     Referencia interna (UUID)
 * @param {object} params.customer     { name, email, phone }
 * @returns {Promise<object>} Respuesta de EcartPay
 */
async function createCharge({ tokenId, amount, description, orderUid, customer }) {
  const authToken = await getAuthToken();

  const payload = {
    token_id:    tokenId,
    amount:      amount,
    currency:    'MXN',
    description: description,
    reference:   orderUid,
    customer: {
      name:  customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  };

  const res = await fetch(`${ECARTPAY_API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': authToken,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data.message || data.error || JSON.stringify(data);
    throw new Error(`EcartPay createCharge falló (${res.status}): ${errorMsg}`);
  }

  return data;
}

module.exports = { getAuthToken, createCharge };
