# 🌿 Los Frutos de María

> **Reduce el estrés. Recupera tu calma en cuerpo y mente.**

Bienvenido al repositorio oficial de **Los Frutos de María**, una marca dedicada al bienestar integral a través de productos a base de CBD y experiencias de reconexión con la naturaleza.

---

## 🌐 Sitio en Vivo
La página web está publicada y puede visitarse en el siguiente enlace:
👉 **[https://jpgarcia04.github.io/losFrutosDeMaria/index.html](https://jpgarcia04.github.io/losFrutosDeMaria/index.html)**

---

## ✨ Características del Proyecto
- **Diseño Premium**: Interfaz moderna, minimalista y elegante orientada a la salud y el bienestar.
- **Catálogo de Productos**: Sección dedicada con detalles de cada producto (Gotas, Cremas, Suplementos, etc.).
- **Experiencias**: Información sobre retiros y hospedajes como "La Cabaña" en Zipolite, Oaxaca.
- **Totalmente Responsivo**: Optimizado para dispositivos móviles, tablets y escritorio.
- **Animaciones Suaves**: Micro-interacciones y efectos de scroll para una navegación fluida.

## 🛠️ Tecnologías Utilizadas
El frontend está construido con tecnologías web puras para garantizar ligereza y rendimiento:
- ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) **HTML5 Semántico**
- ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) **CSS3 Personalizado** (Variables, Flexbox, Grid)
- ![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black) **Vanilla JavaScript**

El pago se procesa con un **backend propio en Node.js** (carpeta [`backend/`](backend/README.md)), desplegado en un VPS, que actúa como intermediario seguro entre el carrito y **EcartPay**. Ver detalle abajo.

---

## 🛒 E-commerce

El sitio incluye un carrito de compras y checkout funcionales:

- **Carrito** ([`js/cart.js`](js/cart.js)): estado persistido en `localStorage`, catálogo de 11 productos con IDs fijos que deben coincidir con la tabla `products` del backend.
- **UI del carrito** ([`js/cart-ui.js`](js/cart-ui.js)): drawer lateral, contador, notificaciones.
- **Checkout** ([`checkout.html`](checkout.html) + [`js/checkout.js`](js/checkout.js)): formulario de envío (32 estados de México) que **no calcula ni envía precios** — solo manda `{ id, quantity }` de cada artículo al backend. El backend valida stock y precios contra su propia base de datos, crea la orden y responde con un `payment_url`: un link hosted de pago seguro de EcartPay al que el navegador redirige. El sitio nunca ve datos de tarjeta ni llaves de pago.

**Backend en producción:** `https://bj-api.site` (VPS propio, no GitHub Pages — ver [`backend/README.md`](backend/README.md) y `context.md` para infraestructura completa).

⚠️ **Estado actual:** el flujo de pago está desplegado y probado end-to-end, pero el backend usa llaves de EcartPay *placeholder* hasta que se carguen las llaves reales de producción — ver `context.md` para el pendiente exacto.

---

## 📦 Catálogo de Bienestar
Nuestros productos están diseñados para nutrir y calmar:
- 💧 **Gotas LFDM**: Bienestar diario y claridad.
- 🧴 **Crema Facial Nocturna**: Skincare consciente con CBD + Colágeno.
- 🦴 **CBD Collagen**: Revitalización profunda.
- 🧘 **Almohada Terapéutica**: Calor, frío y aroma a lavanda.
- 🕯️ **Vela Aromática**: Atmósfera de presencia y calma.
- 🚿 **Shampoo & Pomadas**: Cuidado corporal integral.

---

## 📍 Encuéntranos
Puedes adquirir nuestros productos en:
- [Amazon](https://www.amazon.com.mx/stores/page/E1B77F72-D5B0-47A2-BEB8-696403B0CFA9)
- [Liverpool](https://www.liverpool.com.mx/tienda?s=los+frutos+de+mar%C3%ADa)
- [Suburbia](https://www.suburbia.com.mx/tienda?s=los+frutos+de+maria)

O síguenos en [Instagram](https://www.instagram.com/losfrutosdemaria_) y [Facebook](https://www.facebook.com/LosFrutosdeMaria/).

---

© 2026 Los Frutos de María. Todos los derechos reservados.
