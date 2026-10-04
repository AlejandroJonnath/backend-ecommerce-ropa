import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryMovement } from './entities/inventory-movement.entity.js';
import { InventoryService } from './inventory.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            InventoryMovement,
        ]),
    ],

    providers: [
        InventoryService,
    ],

    exports: [
        InventoryService,
    ],
})
export class InventoryModule { }