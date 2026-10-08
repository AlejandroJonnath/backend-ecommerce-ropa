import {
    IsEnum,
    IsInt,
    IsOptional,
    Max,
    Min,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
    PaymentStatus,
} from '../entities/payment.entity.js';

export class QueryPaymentsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;
}