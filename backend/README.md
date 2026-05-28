# LFDM Backend – API Intermediaria E-commerce

API RESTful que funciona como intermediaria entre el frontend estático (GitHub Pages) de **Los Frutos de María** y la pasarela de pagos **EcartPay**.

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
   - **EcartPay:** `ECARTPAY_SECRET_KEY`, `ECARTPAY_API_URL`
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

Motor de la transacción. Recibe el carrito desde el frontend, valida stock, calcula totales, crea la orden en la BD y cobra en EcartPay.

**Body (JSON):**
```json
{
  "token_id": "tok_xxxxxxxxxxxx",
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
  "message": "Orden creada y pago en proceso.",
  "data": {
    "order_uid": "550e8400-e29b-41d4-a716-446655440000",
    "subtotal": 1647.00,
    "shipping_cost": 0,
    "total_amount": 1647.00,
    "status": "processing"
  }
}
```

### `POST /api/v1/webhooks/ecartpay`

Recepción asíncrona de notificaciones de EcartPay. Actualiza el estado de la orden y descuenta el stock cuando el pago es confirmado.

### `GET /health`

Health check básico para monitoreo.

## Seguridad

- **CORS estricto**: solo acepta peticiones desde el dominio de producción (GitHub Pages) y `localhost`.
- **Helmet**: cabeceras de seguridad HTTP.
- **Rate limiting**: máx. 30 intentos de checkout por IP cada 15 min.
- **Consultas parametrizadas**: todas las consultas SQL usan parámetros preparados (`?`).
- **Transacciones SQL**: las operaciones multi-tabla hacen rollback automático si algo falla.

## Despliegue (VPS Linux con MariaDB)

1. Clonar el repo y navegar a `/backend`
2. `npm install --production`
3. Configurar `.env` con las credenciales de producción
4. Ejecutar migraciones: `npm run migrate`
5. Iniciar con un process manager:

```bash
# Con PM2
pm2 start src/server.js --name lfdm-api

# O con systemd (crear un service)
```

6. Configurar Nginx como reverse proxy al puerto de la API
