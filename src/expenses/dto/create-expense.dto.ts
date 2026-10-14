
import {
    IsDateString,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    Matches,
    MaxLength,
} from 'class-validator';

export class CreateExpenseDto {
    @IsUUID()
    categoryId: string;

    @IsString()
    @Length(3, 200)
    description: string;

    @IsString()
    @Matches(/^\d{1,10}(?:\.\d{1,2})?$/, {
        message:
            'El importe debe ser positivo y tener máximo dos decimales.',
    })
    amount: string;

    @IsDateString()
    expenseDate: string;

    @IsOptional()
    @IsString()
    @MaxLength(3000)
    notes?: string | null;
}
