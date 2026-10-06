import {
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
    Matches,
} from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsString()
    @MinLength(2)
    @MaxLength(120)
    @Matches(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        {
            message:
                'El slug solo puede contener letras minúsculas, números y guiones.',
        },
    )
    slug: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsUrl()
    @MaxLength(2048)
    imageUrl?: string;
}