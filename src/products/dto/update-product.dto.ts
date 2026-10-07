import {
    IsOptional,
    IsString,
    IsUUID,
    IsUrl,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UpdateProductDto {
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(170)
    @Matches(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        {
            message:
                'El slug solo puede contener letras minúsculas, números y guiones.',
        },
    )
    slug?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;

    @IsOptional()
    @IsString()
    @Matches(
        /^\d{1,10}(?:\.\d{1,2})?$/,
        {
            message:
                'El precio base debe ser un número positivo con máximo 2 decimales.',
        },
    )
    basePrice?: string;

    @IsOptional()
    @IsUrl()
    @MaxLength(2048)
    imageUrl?: string;
}