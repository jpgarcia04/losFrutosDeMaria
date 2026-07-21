# LFDM Backend – API Intermediaria E-commerce

API RESTful que funciona como intermediaria entre el frontend estático (GitHub Pages) de **Los Frutos de María** y la pasarela de pagos **EcartPay**.

**En producción en:** `https://bj-api.site` (VPS Ubuntu, Nginx + Certbot + systemd). Ver `../context.md` en la raíz del repo para el detalle completo de la infraestructura.

## Arquitectura de pago (Checkouts hosted, no cargo directo)

El backend **nunca recibe datos de tarjeta**. El flujo es:

1. El frontend envía al backend solo `{ id, quantity }` de cada artículo del carrito — **sin precios**.
2. El backend valida stock y calcula precios/envío contra su propia base de datos (fuente de verdad; el cliente no puede manipular montos).
3. El backend crea una orden interna y llama a `POST {ECARTPAY_API_URL}/checkouts` (autenticado con JWT obtenido vía Basic auth de `ECARTPAY_PUBLIC_KEY:ECARTPAY_PRIVATE_KEY`), pasando el monto ya fijado.
4. EcartPay responde con un `link` de pago hosted; el backend lo reenvía al frontend como `payment_url` y el navegador redirige ahí.
5. El cliente paga en la página segura de EcartPay (el backend nunca ve la tarjeta).
6. EcartPay notifica el resultado via webhook a `POST /api/v1/webhooks/ecartpay`, firmado con HMAC-SHA256 (headers `x-pay-timestamp`, `x-pay-webhook-id`, `x-pay-signature`). El backend valida la firma, marca la orden como pagada/fallida y descuenta stock.

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Base de datos | MySQL / MariaDB |
| Pasarela de pagos | EcartPay API |

## Estructura del Proyecto

```
backend/
├── .env.example              # Variables de entorno (template)
├── .gitignore
├── package.json
├── README.md
└── src/
    ├── server.js             # Punto de entrada
    ├── config/
    │   └── cors.js           # Configuración CORS estricta
    ├── controllers/
    │   ├── checkout.controller.js   # POST /api/v1/checkout
    │   └── webhook.controller.js    # POST /api/v1/webhooks/ecartpay
    ├── db/
    │   ├── connection.js     # Pool de conexiones MySQL
    │   ├── migrate.js        # Script de creación de tablas
    │   └── seed.js           # Datos iniciales de productos
    ├── middleware/
    │   └── validate.js       # Validación de payloads
    ├── models/
    │   ├── order.model.js    # CRUD de órdenes (transaccional)
    │   └── product.model.js  # Consultas de productos
    ├── routes/
    │   └── index.js          # Router principal /api/v1
    └── services/
        └── ecartpay.service.js  # Comunicación con EcartPay
```

## Instalación

```bash
cd backend
npm install
```

## Configuración

1. Copia el archivo de variables de entorno:

```bash
cp .env.example .env
```

2. Edita `.env` con tus credenciales reales:
   - **BD:** `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
   - **EcartPay:** `ECARTPAY_PUBLIC_KEY`, `ECARTPAY_PRIVATE_KEY` (panel EcartPay → Integraciones → API), `ECARTPAY_WEBHOOK_SECRET` (panel → Webhooks), `ECARTPAY_API_URL` (`https://sandbox.ecartpay.com/api` en pruebas, `https://ecartpay.com/api` en producción)
   - **Backend:** `BACKEND_PUBLIC_URL` (URL pública de este backend, usada como `notify_url` del webhook — p. ej. `https://bj-api.site`)
   - **CORS:** `FRONTEND_ORIGIN` (tu dominio de GitHub Pages)

3. Crea la base de datos en MariaDB:

```sql
CREATE DATABASE lfdm_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lfdm_user'@'localhost' IDENTIFIED BY 'tu_contraseña';
GRANT ALL PRIVILEGES ON lfdm_ecommerce.* TO 'lfdm_user'@'localhost';
FLUSH PRIVILEGES;
```

4. Ejecuta las migraciones:

```bash
npm run migrate
```

5. (Opcional) Carga los productos de ejemplo:

```bash
node src/db/seed.js
```

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## Endpoints

### `POST /api/v1/checkout`

Motor de la transacción. Recibe ids + cantidades desde el frontend (**sin precios**), valida stock, calcula totales contra la BD, crea la orden y genera un Checkout hosted en EcartPay.

**Body (JSON):**
```json
{
  "customer": {
    "name": "María García",
    "email": "maria@ejemplo.com",
    "phone": "5512345678"
  },
  "shipping_address": {
    "street": "Av. Reforma",
    "exterior_number": "222",
    "interior_number": "4B",
    "neighborhood": "Juárez",
    "postal_code": "06600",
    "city": "Ciudad de México",
    "state": "CDMX"
  },
  "items": [
    { "id": 1, "quantity": 2 },
    { "id": 3, "quantity": 1 }
  ]
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Orden creada. Redirigiendo al pago…",
  "data": {
    "order_uid": "550e8400-e29b-41d4-a716-446655440000",
    "subtotal": 1647.00,
    "shipping_cost": 0,
    "total_amount": 1647.00,
    "status": "processing",
    "payment_url": "https://ecartpay.com/checkout/xxxxxxxx"
  }
}
```

El frontend redirige el navegador a `payment_url`; ahí el cliente introduce los datos de su tarjeta directamente en la página de EcartPay.

### `POST /api/v1/webhooks/ecartpay`

Recepción asíncrona de notificaciones de EcartPay tras el pago. Valida la firma HMAC-SHA256 (rechaza con 401 si falta o no coincide), busca la orden por el id del checkout o por `reference_id` (el `order_uid`), y actualiza su estado. Al confirmarse el pago (`paid`/`completed`/`approved`/`success`) descuenta el stock dentro de una transacción SQL.

### `GET /health`

Health check básico para monitoreo.

## Seguridad

- **CORS estricto**: solo acepta peticiones desde el dominio de producción (GitHub Pages) y `localhost`.
- **Helmet**: cabeceras de seguridad HTTP.
- **Rate limiting**: máx. 30 intentos de checkout por IP cada 15 min.
- **Consultas parametrizadas**: todas las consultas SQL usan parámetros preparados (`?`).
- **Transacciones SQL**: las operaciones multi-tabla hacen rollback automático si algo falla.

## Despliegue actual (VPS + Nginx + Certbot + systemd)

El backend corre desplegado en un VPS Ubuntu 22.04, en `/opt/lfdm-backend`, como servicio systemd (`lfdm-backend.service`) bajo un usuario del sistema sin privilegios (`lfdm`). Nginx hace de reverse proxy con TLS (Let's Encrypt vía Certbot) en `https://bj-api.site`.

Detalle completo de rutas, comandos de redeploy y cómo conectarse: ver `../context.md` en la raíz del repo (sección "Infraestructura / VPS").

Pasos generales para un despliegue nuevo/desde cero:

1. Copiar `backend/` al servidor (excluyendo `node_modules` y `.env`)
2. `npm ci --omit=dev` dentro de esa carpeta
3. Crear BD y usuario en MariaDB, configurar `.env` con credenciales reales
4. `node src/db/migrate.js` y `node src/db/seed.js`
5. Crear el `.service` de systemd apuntando a `node src/server.js`, `systemctl enable --now`
6. Configurar el server block de Nginx (proxy a `127.0.0.1:3000`) y emitir certificado con `certbot --nginx -d tu-dominio`

Para actualizar código en un despliegue existente: subir los archivos cambiados a `/opt/lfdm-backend`, y `systemctl restart lfdm-backend`.
