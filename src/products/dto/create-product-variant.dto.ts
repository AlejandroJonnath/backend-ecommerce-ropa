import {
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateProductVariantDto {
    @IsUUID()
    sizeId: string;

    @IsUUID()
    colorId: string;

    @IsString()
    @Min(2)
    @MaxLength(100)
    sku: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{1,10}(?:\.\d{1,2})?$/, {
        message:
            'El precio debe ser un número positivo con máximo 2 decimales.',
    })
    price?: string;

    @IsString()
    @Matches(/^\d{1,10}(?:\.\d{1,2})?$/, {
        message:
            'El costo debe ser un número positivo con máximo 2 decimales.',
    })
    cost: string;
}