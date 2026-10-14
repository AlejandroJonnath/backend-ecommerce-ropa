
import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

import { RefundStatus } from '../entities/refund.entity.js';

export class UpdateRefundStatusDto {
    @IsEnum(RefundStatus)
    status: RefundStatus;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    externalReference?: string;
}
