import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

import { PaymentMethod } from '../entities/payment.entity.js';

export class CreatePaymentDto {
    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    externalReference?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}