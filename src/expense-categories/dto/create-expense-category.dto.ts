
import {
    IsOptional,
    IsString,
    Length,
    Matches,
} from 'class-validator';

export class CreateExpenseCategoryDto {
    @IsString()
    @Length(2, 100)
    name: string;

    @IsString()
    @Length(2, 120)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message:
            'El slug debe contener minúsculas, números y guiones, sin espacios.',
    })
    slug: string;

    @IsOptional()
    @IsString()
    @Length(0, 2000)
    description?: string | null;
}
