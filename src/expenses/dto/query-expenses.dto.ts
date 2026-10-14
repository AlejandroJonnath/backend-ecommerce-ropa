
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsInt,
    IsOptional,
    IsUUID,
    Max,
    Min,
} from 'class-validator';

export class QueryExpensesDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;

    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}
