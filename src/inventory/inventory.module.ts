import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductVariant } from '../products/entities/product-variant.entity.js';

import { InventoryMovement } from './entities/inventory-movement.entity.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ProductVariant,
            InventoryMovement,
        ]),
    ],

    controllers: [
        InventoryController,
    ],

    providers: [
        InventoryService,
    ],

    exports: [
        InventoryService,
    ],
})
export class InventoryModule { }