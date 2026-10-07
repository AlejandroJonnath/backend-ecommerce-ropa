import {
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateInventoryAdjustmentDto {
    @IsInt()
    @Min(-1_000_000_000)
    @Max(1_000_000_000)
    quantity: number;

    @IsString()
    @Min(3)
    @MaxLength(500)
    reason: string;

    @IsOptional()
    @IsUUID()
    referenceId?: string;
}