import 'dotenv/config';

const cancelUrl = process.env.STRIPE_CANCEL_URL ?? process.env.STRIPE_CANCEL_UR;

const rawEnv: Record<string, string | undefined> = {
  PORT: process.env.PORT,
  STRIPE_SECRET: process.env.STRIPE_SECRET,
  STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL,
  STRIPE_CANCEL_URL: cancelUrl,
  STRIPE_ENDPOINT_SECRET: process.env.STRIPE_ENDPOINT_SECRET,
};

const missing = Object.entries(rawEnv)
  .filter(([, value]) => value === undefined || value.trim() === '')
  .map(([key]) => key);

if (missing.length > 0) {
  throw new Error(
    `Config validation error: faltan variables de entorno -> ${missing.join(', ')}. ` +
      'Copia .env.template a .env y completa los valores.',
  );
}

const port = Number(rawEnv.PORT);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(
    `Config validation error: PORT debe ser un numero entero positivo (recibido: "${rawEnv.PORT}")`,
  );
}

export const envs = {
  port,
  stripeSecret: rawEnv.STRIPE_SECRET as string,
  stripeSuccessUrl: rawEnv.STRIPE_SUCCESS_URL as string,
  stripeCancelUrl: rawEnv.STRIPE_CANCEL_URL as string,
  stripeEndpointSecret: rawEnv.STRIPE_ENDPOINT_SECRET as string,
};
