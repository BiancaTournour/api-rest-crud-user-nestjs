import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

// DTO para representar cada producto/item dentro de la orden
export class PaymentItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  // Precio unitario enviado por el cliente
  @IsNumber()
  @IsPositive()
  price!: number;

  @IsNumber()
  @IsPositive()
  quantity!: number;
}

// DTO principal para la solicitud de creacion de sesion de pago
export class CreatePaymentSessionDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items!: PaymentItemDto[];
}
