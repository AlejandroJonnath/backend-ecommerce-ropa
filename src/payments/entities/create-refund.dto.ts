
import {
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateRefundDto {
    @IsString()
    @Matches(/^\d{1,10}(?:\.\d{1,2})?$/, {
        message: 'El importe debe ser positivo y tener máximo 2 decimales.',
    })
    amount: string;

    @IsString()
    @MinLength(3)
    @MaxLength(500)
    reason: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    externalReference?: string;
}
