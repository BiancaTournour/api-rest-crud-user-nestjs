import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';

jest.mock('../config/envs', () => ({
  envs: {
    port: 3003,
    stripeSecret: 'sk_test_fake',
    stripeSuccessUrl: 'http://localhost:3003/payments/success',
    stripeCancelUrl: 'http://localhost:3003/payments/cancel',
    stripeEndpointSecret: 'whsec_fake',
  },
}));

const sessionsCreate = jest.fn();
const constructEvent = jest.fn();

jest.mock('stripe', () => {
  class StripeMock {
    checkout = { sessions: { create: sessionsCreate } };
    webhooks = { constructEvent };
    static errors = { StripeInvalidRequestError: class extends Error {} };
  }
  return { __esModule: true, default: StripeMock };
});

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('crea la Checkout Session con el monto en centavos y el orderId en metadata', async () => {
    sessionsCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });

    const result = await service.createPaymentSession({
      orderId: 'ord-1',
      currency: 'usd',
      items: [{ name: 'Producto', price: 20, quantity: 1 }],
    });

    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        payment_intent_data: { metadata: { orderId: 'ord-1' } },
        line_items: [
          expect.objectContaining({
            quantity: 1,
            price_data: expect.objectContaining({
              currency: 'usd',
              unit_amount: 2000,
            }),
          }),
        ],
      }),
    );
    expect(result).toEqual({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
      orderId: 'ord-1',
    });
  });

  it('responde 400 si la firma del webhook es invalida', () => {
    constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature');
    });

    expect(() => service.handleWebhook(Buffer.from('{}'), 'firma-mala')).toThrow(
      BadRequestException,
    );
  });

  it('extrae el orderId en charge.succeeded', () => {
    constructEvent.mockReturnValue({
      type: 'charge.succeeded',
      data: {
        object: {
          id: 'ch_1',
          amount: 2000,
          currency: 'usd',
          metadata: { orderId: 'ord-1' },
        },
      },
    });

    expect(service.handleWebhook(Buffer.from('{}'), 'firma-ok')).toEqual({
      received: true,
      event: 'charge.succeeded',
      orderId: 'ord-1',
    });
  });

  it('marca como no manejado cualquier otro evento', () => {
    constructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    });

    expect(service.handleWebhook(Buffer.from('{}'), 'firma-ok')).toEqual({
      received: true,
      event: 'payment_intent.created',
    });
  });
});
