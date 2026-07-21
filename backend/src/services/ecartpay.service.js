/**
 * ═══════════════════════════════════════════════════════════════
 *  Servicio EcartPay
 *  Encapsula toda la comunicación con la pasarela de pagos.
 *  Usa la API nativa `fetch` de Node 18+ (sin dependencias extra).
 *
 *  Flujo "Checkouts":
 *    1. POST /authorizations/token  (Basic public:private) → JWT 1 h
 *    2. POST /checkouts             (Bearer JWT)           → link hosted
 *  El cliente paga en la página de EcartPay; la confirmación
 *  llega por webhook a /api/v1/webhooks/ecartpay.
 * ═══════════════════════════════════════════════════════════════
 */

const ECARTPAY_API_URL     = process.env.ECARTPAY_API_URL || 'https://sandbox.ecartpay.com/api';
const ECARTPAY_PUBLIC_KEY  = process.env.ECARTPAY_PUBLIC_KEY;
const ECARTPAY_PRIVATE_KEY = process.env.ECARTPAY_PRIVATE_KEY;

/**
 * Cache básico para el token de autorización.
 * EcartPay emite JWT con expiración de 1 hora; se renueva
 * automáticamente con 5 minutos de margen.
 */
let authCache = { token: null, expiresAt: 0 };

/**
 * Obtiene (o renueva) el token de autorización de EcartPay.
 * Endpoint: POST /authorizations/token
 * Auth:     Basic base64(public_key:private_key)
 * @returns {Promise<string>} Bearer token (JWT)
 */
async function getAuthToken() {
  const now = Date.now();

  if (authCache.token && authCache.expiresAt > now) {
    return authCache.token;
  }

  if (!ECARTPAY_PUBLIC_KEY || !ECARTPAY_PRIVATE_KEY) {
    throw new Error('Faltan ECARTPAY_PUBLIC_KEY / ECARTPAY_PRIVATE_KEY en el entorno');
  }

  const basic = Buffer
    .from(`${ECARTPAY_PUBLIC_KEY}:${ECARTPAY_PRIVATE_KEY}`)
    .toString('base64');

  const res = await fetch(`${ECARTPAY_API_URL}/authorizations/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${basic}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EcartPay auth falló (${res.status}): ${body}`);
  }

  const data = await res.json();

  // El token dura 1 h; renovamos a los 55 min
  authCache = {
    token:     data.token,
    expiresAt: now + 55 * 60 * 1000,
  };

  return authCache.token;
}

/**
 * Crea un Checkout hosted en EcartPay con el monto fijado
 * por el servidor y devuelve el link de pago.
 * Endpoint: POST /checkouts
 *
 * @param {object}   params
 * @param {number}   params.total      Monto total en MXN (fijado server-side)
 * @param {string}   params.concept    Descripción del cargo
 * @param {string}   params.orderUid   Referencia interna (UUID de la orden)
 * @param {object[]} params.items      [{ name, price, quantity }]
 * @param {string}   params.notifyUrl  URL del webhook de confirmación
 * @returns {Promise<object>} Respuesta de EcartPay ({ id, link, … })
 */
async function createCheckout({ total, concept, orderUid, items, notifyUrl }) {
  const authToken = await getAuthToken();

  const payload = {
    currency:     'MXN',
    amounts:      [Number(total.toFixed(2))],
    concept:      concept,
    items:        items.map((i) => ({
      name:     i.name,
      price:    i.price,
      quantity: i.quantity,
    })),
    notify_url:   notifyUrl,
    reference_id: orderUid,
    reference:    `Orden LFDM ${orderUid}`,
  };

  const res = await fetch(`${ECARTPAY_API_URL}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.link) {
    const errorMsg = data.message || data.error || JSON.stringify(data);
    throw new Error(`EcartPay createCheckout falló (${res.status}): ${errorMsg}`);
  }

  return data;
}

module.exports = { getAuthToken, createCheckout };
