import {
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateInventoryPurchaseDto {
    @IsInt()
    @Min(1)
    @Max(1_000_000_000)
    quantity: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;

    @IsOptional()
    @IsUUID()
    referenceId?: string;
}