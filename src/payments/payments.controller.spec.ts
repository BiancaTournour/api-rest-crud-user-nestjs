import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
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

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const paymentsServiceMock = {
    createPaymentSession: jest.fn(),
    handleWebhook: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: paymentsServiceMock }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('devuelve ok en /success y /cancel', () => {
    expect(controller.success()).toEqual({
      ok: true,
      message: 'Payment successful',
    });
    expect(controller.cancel()).toEqual({
      ok: false,
      message: 'Payment cancelled',
    });
  });

  it('rechaza el webhook sin cabecera stripe-signature', () => {
    expect(() => controller.handleWebhook({ rawBody: Buffer.from('{}') } as any)).toThrow(
      BadRequestException,
    );
    expect(paymentsServiceMock.handleWebhook).not.toHaveBeenCalled();
  });

  it('rechaza el webhook si no hay rawBody', () => {
    expect(() => controller.handleWebhook({} as any, 'firma')).toThrow(
      BadRequestException,
    );
  });
});
