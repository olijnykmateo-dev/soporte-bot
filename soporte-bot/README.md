# SoporteBot — Chatbot de soporte posventa para ecommerce

Chatbot de soporte posventa impulsado por Claude AI, listo para integrar en **Tiendanube** o **MercadoShops**.

---

## Estructura del proyecto

```
soporte-bot/
├── api/
│   └── chat.js          ← Serverless function (el cerebro del bot)
├── public/
│   └── widget.js        ← Widget embebible para tu tienda
├── vercel.json          ← Configuración de Vercel
├── package.json
└── README.md
```

---

## Deploy en 5 pasos

### 1. Cloná o descargá este proyecto

```bash
# Si tenés Git
git init
git add .
git commit -m "SoporteBot inicial"
```

### 2. Creá una cuenta en Vercel

Entrá a [vercel.com](https://vercel.com) → Sign Up (podés usar tu cuenta de GitHub/Google).

### 3. Instalá Vercel CLI y deployá

```bash
npm install
npx vercel login
npx vercel --prod
```

Vercel te va a dar una URL del tipo: `https://soporte-bot-XXXX.vercel.app`

### 4. Configurá tu API Key de Claude

En el dashboard de Vercel:
- Settings → Environment Variables
- Agregá: `ANTHROPIC_API_KEY` = `sk-ant-...` (de console.anthropic.com)
- Redeploy: `npx vercel --prod`

### 5. Pegá el widget en tu tienda

#### Tiendanube
Admin → Mi tienda → Personalización → Código adicional → Footer

#### MercadoShops  
Admin → Apariencia → Código HTML personalizado → Footer

```html
<script
  src="https://TU-PROYECTO.vercel.app/widget.js"
  data-api="https://TU-PROYECTO.vercel.app/api/chat"
  data-store="Nombre de tu tienda"
  data-bot-name="Sofia"
  data-color="#1D9E75"
  data-returns-policy="30 días desde la compra, sin uso"
  data-shipping-time="3 a 7 días hábiles"
  data-support-hours="Lunes a viernes de 9 a 18 hs"
></script>
```

---

## Personalización

| Atributo | Descripción | Ejemplo |
|---|---|---|
| `data-store` | Nombre de la tienda | `"Ropa Linda"` |
| `data-bot-name` | Nombre del asistente | `"Laura"` |
| `data-color` | Color principal (hex) | `"#E63946"` |
| `data-returns-policy` | Política de devoluciones | `"15 días con ticket"` |
| `data-shipping-time` | Tiempo de envío | `"2 a 5 días hábiles"` |
| `data-support-hours` | Horario humano | `"Lunes a sábado 10-17 hs"` |

---

## Costos estimados

| Uso | Costo API Claude | Costo Vercel |
|---|---|---|
| Hasta 500 consultas/mes | ~$1.50 USD | Gratis |
| Hasta 2.000 consultas/mes | ~$6 USD | Gratis |
| Hasta 10.000 consultas/mes | ~$30 USD | $20 USD/mes |

*Basado en conversaciones promedio de 6 mensajes con Claude Sonnet 4.*

---

## Integración avanzada: estado de pedidos en tiempo real

Para que el bot pueda responder con el estado real de un pedido, agregás esto en `api/chat.js` antes de llamar a Claude:

```javascript
// Extraer número de orden del mensaje del usuario
const orderMatch = userMessage.match(/#?(\d{4,})/);
if (orderMatch) {
  const orderId = orderMatch[1];
  const orderRes = await fetch(
    `https://api.tiendanube.com/v1/${STORE_ID}/orders/${orderId}`,
    { headers: { Authorization: `Bearer ${process.env.TIENDANUBE_TOKEN}` } }
  );
  const order = await orderRes.json();
  // Añadir al system prompt:
  // `Pedido #${orderId}: estado ${order.status}, enviado por ${order.shipping_tracking_number}`
}
```

Necesitás el token de API de Tiendanube desde: Admin → Mi cuenta → Aplicaciones → Crear aplicación.
