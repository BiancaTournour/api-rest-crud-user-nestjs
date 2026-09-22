import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 1. Endpoint REST para crear la sesion de Checkout en Stripe
  @Post('create-payment-session')
  createPaymentSession(
    @Body() createPaymentSessionDto: CreatePaymentSessionDto,
  ) {
    return this.paymentsService.createPaymentSession(createPaymentSessionDto);
  }

  // 2. Rutas de redireccion de retorno (success_url / cancel_url de Stripe)
  @Get('success')
  success() {
    return { ok: true, message: 'Payment successful' };
  }

  @Get('cancel')
  cancel() {
    return { ok: false, message: 'Payment cancelled' };
  }

  // 3. Endpoint de Webhook para recibir notificaciones de Stripe
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Falta la cabecera stripe-signature');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException(
        'El cuerpo crudo (rawBody) no esta disponible',
      );
    }

    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
