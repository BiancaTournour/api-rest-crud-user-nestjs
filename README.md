# Payments MS — sesiones de pago y webhook de Stripe

Microservicio HTTP en NestJS que crea Checkout Sessions en Stripe y recibe la
confirmación del cobro por webhook.
(Programación Avanzada — TP: sesiones de pago y webhook Stripe)

## Requisitos

- Node.js 20+
- Cuenta de Stripe en modo **test** y [Stripe CLI](https://docs.stripe.com/stripe-cli)

## Levantar el proyecto

```bash
npm install
cp .env.template .env   # completar con las claves de test
npm run start:dev
```

La config es **fail-fast**: si falta `PORT`, `STRIPE_SECRET`,
`STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL` o `STRIPE_ENDPOINT_SECRET`, la app no
arranca y muestra qué variable falta (`src/config/envs.ts`).

| Variable | Uso |
|----------|-----|
| `PORT` | Puerto HTTP (sugerido `3003`) |
| `STRIPE_SECRET` | Clave secreta de test (`sk_test_...`) |
| `STRIPE_SUCCESS_URL` | `http://localhost:3003/payments/success` |
| `STRIPE_CANCEL_URL` | `http://localhost:3003/payments/cancel` |
| `STRIPE_ENDPOINT_SECRET` | Signing secret del webhook (`whsec_...`) |

`.env` no se versiona; sí `.env.template`.

## Rutas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/payments/create-payment-session` | Crea la Checkout Session y devuelve `id` y `url` |
| `POST` | `/payments/webhook` | Recibe los eventos de Stripe (verifica la firma) |
| `GET` | `/payments/success` | Redirect de éxito → `{ ok: true, ... }` |
| `GET` | `/payments/cancel` | Redirect de cancelación → `{ ok: false, ... }` |

### 1. Crear la sesión de pago

```bash
curl -X POST http://localhost:3003/payments/create-payment-session \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ord-1",
    "currency": "usd",
    "items": [{ "name": "Producto", "price": 20, "quantity": 1 }]
  }'
```

Respuesta:

```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "orderId": "ord-1"
}
```

Validaciones (`ValidationPipe` global con `whitelist` y
`forbidNonWhitelisted`): un request sin `items`, con `price` negativo o con
campos extra responde `400`. El `price` se envía a Stripe en centavos
(`Math.round(price * 100)`) y el `orderId` viaja en
`payment_intent_data.metadata`.

### 2. Webhook

```bash
stripe listen --forward-to localhost:3003/payments/webhook
```

Copiar el `whsec_...` que imprime la CLI en `STRIPE_ENDPOINT_SECRET` y reiniciar
la app. Luego abrir la `url` de la sesión y pagar con una
[tarjeta de prueba](https://docs.stripe.com/testing) (`4242 4242 4242 4242`).
ha
Comportamiento:

| Resultado | Respuesta |
|-----------|-----------|
| Firma inválida o falta `stripe-signature` | `400`, el evento no se procesa |
| `charge.succeeded` | `200` + log con el `orderId` de `metadata` |
| Otros `event.type` | `200` + log de "evento no manejado" |

El cuerpo se recibe crudo (`NestFactory.create(AppModule, { rawBody: true })` y
`req.rawBody`) porque la verificación de firma se hace sobre los bytes
originales, no sobre el JSON ya parseado.

## Tests

```bash
npm test
```

## Estructura relevante

```
src/
├── config/envs.ts                     # validación fail-fast de variables de entorno
├── main.ts                            # rawBody + ValidationPipe global
└── payments/
    ├── dto/create-payment-session.dto.ts
    ├── payments.controller.ts
    ├── payments.service.ts
    └── payments.module.ts
```
