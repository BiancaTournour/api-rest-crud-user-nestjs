import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config/envs';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe = new Stripe(envs.stripeSecret);

  /**
   * Entrega 1: crea una Checkout Session (mode: payment) en Stripe.
   * El orderId viaja en payment_intent_data.metadata para poder recuperarlo
   * despues en el webhook (entrega 2).
   */
  async createPaymentSession(createPaymentSessionDto: CreatePaymentSessionDto) {
    const { orderId, currency, items } = createPaymentSessionDto;

    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: { name: item.name },
        // Stripe espera el monto en la unidad minima de la moneda (centavos)
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        payment_intent_data: {
          metadata: { orderId },
        },
        success_url: envs.stripeSuccessUrl,
        cancel_url: envs.stripeCancelUrl,
      });

      this.logger.log(
        `Checkout Session creada: ${session.id} (orderId: ${orderId})`,
      );

      return {
        id: session.id,
        url: session.url,
        orderId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al crear la Checkout Session: ${message}`);

      // Datos rechazados por Stripe (moneda inexistente, monto invalido, etc.)
      if (error instanceof Stripe.errors.StripeInvalidRequestError) {
        throw new BadRequestException(message);
      }

      throw new InternalServerErrorException(
        'No se pudo crear la sesion de pago en Stripe',
      );
    }
  }

  /**
   * Entrega 2: verifica la firma del webhook y procesa el evento.
   * Firma invalida -> 400 y no se procesa nada.
   * charge.succeeded -> se extrae metadata.orderId y se loguea.
   * Otros eventos -> log de "no manejado" y 200 para que Stripe no reintente.
   */
  handleWebhook(rawBody: Buffer | string, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        envs.stripeEndpointSecret,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'firma invalida';
      this.logger.error(`Firma de webhook invalida: ${message}`);
      throw new BadRequestException(`Webhook Error: ${message}`);
    }

    switch (event.type) {
      case 'charge.succeeded': {
        const charge = event.data.object;
        // metadata del PaymentIntent, propagada al Charge
        const orderId = charge.metadata?.orderId ?? null;

        this.logger.log(
          `Pago confirmado | evento: ${event.type} | orderId: ${orderId} | ` +
            `chargeId: ${charge.id} | monto: ${charge.amount} ${charge.currency}`,
        );

        return { received: true, event: event.type, orderId };
      }

      default:
        this.logger.warn(`Evento no manejado: ${event.type}`);
        return { received: true, event: event.type };
    }
  }
}
