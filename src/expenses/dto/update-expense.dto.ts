
import {
    IsDateString,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    Matches,
    MaxLength,
} from 'class-validator';

export class UpdateExpenseDto {
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsString()
    @Length(3, 200)
    description?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{1,10}(?:\.\d{1,2})?$/, {
        message:
            'El importe debe ser positivo y tener máximo dos decimales.',
    })
    amount?: string;

    @IsOptional()
    @IsDateString()
    expenseDate?: string;

    @IsOptional()
    @IsString()
    @MaxLength(3000)
    notes?: string | null;
}
