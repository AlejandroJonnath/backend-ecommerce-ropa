import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

import {
    PaymentStatus,
} from '../entities/payment.entity.js';

export class UpdatePaymentStatusDto {
    @IsEnum(PaymentStatus)
    status: PaymentStatus;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;
}