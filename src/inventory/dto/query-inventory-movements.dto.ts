import {
    IsIn,
    IsInt,
    IsOptional,
    Max,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import { InventoryMovementType } from '../entities/inventory-movement.entity.js';

export class QueryInventoryMovementsDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsOptional()
    @IsIn([
        InventoryMovementType.PURCHASE,
        InventoryMovementType.SALE,
        InventoryMovementType.RETURN,
        InventoryMovementType.DAMAGE,
        InventoryMovementType.ADJUSTMENT,
    ])
    type?: InventoryMovementType;
}