# Contexto del proyecto — Los Frutos de María (E-commerce)

> Este documento es para que una instancia nueva de Claude Code (u otro desarrollador) pueda retomar el trabajo sin tener que releer todo el historial de conversación. Refleja el estado al **2026-07-20**.
>
> **No pongas secretos aquí** (llaves de API, contraseñas). Este repo se publica en GitHub Pages y probablemente es público. Las credenciales reales viven únicamente en el `.env` del VPS (no versionado) o las tiene el dueño del proyecto.

## Qué es esto

Sitio de e-commerce de **Los Frutos de María** (productos de bienestar/CBD). Es un sitio estático (HTML/CSS/JS vanilla, sin build step) publicado en GitHub Pages, con un **backend propio en un VPS** que actúa de intermediario seguro con la pasarela de pagos **EcartPay**.

- Frontend en vivo: https://jpgarcia04.github.io/losFrutosDeMaria/
- Backend en vivo: https://bj-api.site
- Repo: `jpgarcia04/losFrutosDeMaria` en GitHub, rama `main`, se despliega solo (GitHub Actions, `.github/workflows/static.yml`) en cada push a `main`.

## Arquitectura de pago (importante, léelo antes de tocar el checkout)

**El navegador nunca calcula precios ni toca EcartPay directamente.** Flujo:

1. `js/checkout.js` manda al backend solo `{ id, quantity }` de cada línea del carrito, más los datos de contacto/envío. Ningún precio viaja desde el cliente.
2. El backend (`backend/src/controllers/checkout.controller.js`) valida stock y calcula precios/envío contra su propia base de datos MariaDB — es la única fuente de verdad de montos.
3. El backend llama a `POST {ECARTPAY_API_URL}/checkouts` (servicio `backend/src/services/ecartpay.service.js`), autenticado con un JWT que se obtiene vía Basic Auth de `ECARTPAY_PUBLIC_KEY:ECARTPAY_PRIVATE_KEY`. Le pasa el monto ya fijado por el servidor.
4. EcartPay responde con un `link` de checkout hosted; el backend lo reenvía al frontend como `payment_url`, y `js/checkout.js` hace `window.location.href = payment_url`.
5. El cliente introduce los datos de su tarjeta en la página de EcartPay (nunca en nuestro dominio).
6. EcartPay notifica el resultado de forma asíncrona vía webhook a `POST https://bj-api.site/api/v1/webhooks/ecartpay`, firmado con HMAC-SHA256 (`backend/src/controllers/webhook.controller.js` valida la firma con `crypto.timingSafeEqual`, headers `x-pay-timestamp` / `x-pay-webhook-id` / `x-pay-signature`). Si el pago se confirma, marca la orden `paid` y descuenta stock en una transacción SQL.

Se llegó a esta arquitectura tras evaluar (y descartar) hacer todo client-side: la llave privada de EcartPay no puede vivir en el navegador sin exponer control total de la cuenta a cualquiera que abra DevTools. También se descartó una alternativa 100% serverless (Cloudflare Workers/Vercel) porque el usuario ya tenía un VPS disponible y prefirió reutilizarlo.

Documentación de referencia de EcartPay (consultada vía `docs.ecartpay.com`, no hay copia local): `docs/checkout.md`, `docs/webhook-authentication.md`, `docs/webhook-events.md`, `reference/create-authorization-token.md`, `reference/create-a-checkout.md`.

## Estructura del repo

```
/                       ← sitio estático (GitHub Pages sirve todo el repo)
├── index.html, cabania.html, productos/*.html
├── checkout.html       ← formulario de checkout
├── js/
│   ├── cart.js          ← estado del carrito (localStorage) + PRODUCT_CATALOG (11 productos, IDs fijos)
│   ├── cart-ui.js        ← drawer, badge, toasts
│   └── checkout.js       ← llama a POST https://bj-api.site/api/v1/checkout y redirige a payment_url
├── css/
├── backend/              ← API Node.js/Express, desplegada en el VPS (NO se sirve por GitHub Pages)
│   ├── README.md          ← detalle de endpoints, variables de entorno, instalación
│   └── src/
│       ├── server.js               punto de entrada, trust proxy activado (detrás de Nginx)
│       ├── config/cors.js          CORS: permite FRONTEND_ORIGIN + peticiones sin Origin (webhooks/curl)
│       ├── controllers/            checkout.controller.js, webhook.controller.js
│       ├── services/ecartpay.service.js   auth + creación de Checkout hosted
│       ├── models/                 product.model.js, order.model.js (consultas parametrizadas)
│       ├── db/                     connection.js, migrate.js (DDL), seed.js (11 productos)
│       └── middleware/validate.js  valida el payload de /checkout
└── context.md            ← este archivo
```

**IDs de producto**: `js/cart.js` (`PRODUCT_CATALOG`) y la tabla `products` de la BD deben tener exactamente los mismos 11 IDs (1–11). Si agregas/quitas un producto del catálogo del frontend, actualiza también `backend/src/db/seed.js` y la tabla en el VPS — si no coinciden, el checkout de ese producto falla con "no encontrado".

## Infraestructura — VPS

| Dato | Valor |
|---|---|
| Proveedor | IONOS |
| IP | `74.208.218.112` |
| Dominio | `bj-api.site` (+ `www.bj-api.site`) → apunta a esa IP |
| OS | Ubuntu 22.04.5 LTS |
| RAM | 856 MB + 1 GB de swap (se agregó swap porque la RAM es justa) |
| Acceso SSH | usuario `root`, autenticación por **llave pública** ya instalada (`lfdm-deploy` en `authorized_keys`). La contraseña original de root sigue activa también — considera pedir al dueño que la desactive (`PasswordAuthentication no` en sshd_config) una vez confirmes que la llave funciona, es un cambio de configuración de seguridad que requiere su ok explícito. |

### Servicios en el VPS

| Servicio | Detalle |
|---|---|
| `lfdm-backend.service` (systemd) | Node.js corriendo `/opt/lfdm-backend/src/server.js` como usuario del sistema `lfdm` (sin privilegios), `Restart=always`. Logs: `journalctl -u lfdm-backend` |
| Nginx | Reverse proxy `bj-api.site` → `127.0.0.1:3000`, config en `/etc/nginx/sites-available/bj-api.site`. HTTP redirige a HTTPS (301). |
| Certbot | Certificado Let's Encrypt para `bj-api.site` + `www.bj-api.site`, emitido con el plugin nginx (`authenticator = nginx`). Expira 2026-09-04; `certbot.timer` está activo y renueva solo. |
| MariaDB | BD `lfdm_ecommerce`, usuario `lfdm_user` (password solo en el `.env` del servidor, generado con `openssl rand -hex 16`, nunca se registró en ningún log ni chat). |

Código de la app en `/opt/lfdm-backend` (no es un git clone, se sube por `scp`/`tar` — ver "Cómo redesplegar" abajo).

### Qué había antes (ya no existe)

El VPS tenía una app anterior sin relación (`beneficio-joven`, PM2 + BD propia) que el dueño pidió borrar por completo. Se respaldó antes de eliminar en `/root/backups/beneficio-joven-20260721-023218/` (dump SQL + tarball de archivos + config nginx vieja), por si algún día hace falta. El usuario del sistema `beneficio-joven` fue eliminado.

### Cómo conectarte

Desde una máquina con la llave privada correcta:
```bash
ssh root@74.208.218.112
```
Si es una máquina nueva sin la llave, pide al dueño la contraseña de root (no documentada aquí a propósito) o que agregue tu llave pública a `~/.ssh/authorized_keys`.

### Cómo redesplegar el backend tras cambios de código

Desde la raíz del repo local:
```bash
tar czf - --exclude='node_modules' --exclude='.env' backend | ssh root@74.208.218.112 'tar xzf - --strip-components=1 -C /opt/lfdm-backend'
ssh root@74.208.218.112 'cd /opt/lfdm-backend && npm ci --omit=dev --no-audit --no-fund && chown -R lfdm:lfdm /opt/lfdm-backend && systemctl restart lfdm-backend'
```
El `.env` del servidor **nunca se sobreescribe** con este comando (se excluye del tar). Si agregas variables de entorno nuevas, hay que editarlo a mano en el servidor: `nano /opt/lfdm-backend/.env`.

Verificar que quedó bien:
```bash
curl https://bj-api.site/health
journalctl -u lfdm-backend --no-pager -n 20
```

## Variables de entorno del backend (`.env`, solo en el VPS)

Ver `backend/.env.example` para la lista completa con comentarios. Resumen de las que importan:

- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` → apuntan a MariaDB local (`127.0.0.1:3306`, BD `lfdm_ecommerce`)
- `ECARTPAY_PUBLIC_KEY`, `ECARTPAY_PRIVATE_KEY` → **actualmente son placeholders** (`REEMPLAZAR_LLAVE_PUBLICA` / `REEMPLAZAR_LLAVE_PRIVADA`). Se obtienen en el panel de EcartPay → Integraciones → API.
- `ECARTPAY_WEBHOOK_SECRET` → **también placeholder**. Se obtiene en el panel de EcartPay → Webhooks.
- `ECARTPAY_API_URL` → ya está en `https://ecartpay.com/api` (producción, no sandbox).
- `BACKEND_PUBLIC_URL=https://bj-api.site` → se usa para armar el `notify_url` que se manda a EcartPay al crear cada checkout.
- `FRONTEND_ORIGIN=https://jpgarcia04.github.io` → único origen aceptado por CORS para peticiones de navegador (las peticiones sin header `Origin`, como el webhook de EcartPay o `curl`, siempre se permiten).

## Pendientes activos

1. **Cargar las llaves reales de EcartPay.** Es el único bloqueante para que el sitio cobre de verdad. En cuanto el dueño las tenga: editar `/opt/lfdm-backend/.env` con `ECARTPAY_PUBLIC_KEY`, `ECARTPAY_PRIVATE_KEY`, `ECARTPAY_WEBHOOK_SECRET` reales, y `systemctl restart lfdm-backend`.
2. **Confirmar con EcartPay si el checkout hosted soporta URL de retorno tras el pago.** Hoy, después de pagar, el cliente se queda en la página de confirmación de EcartPay — no hay redirect documentado de vuelta a `checkout.html?paid=1&order=<uid>` (ese parámetro ya está soportado del lado del frontend, solo falta que algo lo dispare). Contacto de EcartPay: Mauricio A. González Villalobos — mauricio.gonzalez@transactia.net — (55) 4363-2929.
3. **Opcional / recomendado:** deshabilitar autenticación por contraseña en SSH del VPS ahora que la llave funciona (requiere confirmación explícita del dueño antes de hacerlo, es un cambio de seguridad).
4. **Opcional:** el `backend/` no es un git repo en el VPS — si se vuelve incómodo desplegar por `tar`/`scp`, se podría clonar el repo ahí directamente y usar `git pull` + restart como flujo de despliegue.

## Bugs ya corregidos durante el despliegue (por si reaparecen)

- `backend/src/routes/index.js` tenía rutas de `require()` rotas (`./middleware/...` en vez de `../middleware/...`) — el server no arrancaba.
- Faltaba `app.set('trust proxy', 1)` en `server.js` — necesario detrás de Nginx para que `express-rate-limit` identifique la IP real del cliente en vez de la de Nginx.
- `config/cors.js` rechazaba peticiones sin header `Origin` en producción — eso habría bloqueado los webhooks de EcartPay (que no mandan `Origin`, es tráfico servidor-a-servidor). Se cambió a permitir siempre peticiones sin `Origin`.
- El catálogo del frontend (`js/cart.js`) tenía 11 productos pero la BD solo tenía 9 sembrados — los IDs 10 y 11 (gotas 300mg e Isolated) fallaban al comprar. Se agregaron a `seed.js` y a la BD del VPS.

## Cómo probar el flujo de checkout localmente / en el VPS sin gastar una transacción real

Con las llaves placeholder, el checkout crea la orden en la BD (puedes verificarla con `mysql lfdm_ecommerce -e "SELECT * FROM orders ORDER BY id DESC LIMIT 5;"`) pero falla al llamar a EcartPay (esperado, 502). Para probar el webhook de forma aislada sin pasar por EcartPay, hay que generar una firma HMAC válida a mano con el `ECARTPAY_WEBHOOK_SECRET` del `.env` — ver la lógica exacta en `webhook.controller.js` (`isValidSignature`).
