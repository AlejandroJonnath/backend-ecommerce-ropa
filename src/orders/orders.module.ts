import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryModule } from '../inventory/inventory.module.js';
import { OrderItem } from '../order-items/entities/order-item.entity.js';
import { ProductVariant } from '../products/entities/product-variant.entity.js';
import { Order } from './entities/order.entity.js';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';

@Module({

    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            ProductVariant,
        ]),
        InventoryModule,
    ],

    controllers: [
        OrdersController
    ],

    providers: [
        OrdersService,
    ],

    exports: [
        OrdersService,
    ],
})
export class OrdersModule { }