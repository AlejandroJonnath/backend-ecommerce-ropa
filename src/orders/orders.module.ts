
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryModule } from '../inventory/inventory.module.js';
import { Order } from './entities/order.entity.js';
import { OrderItem } from '../order-items/entities/order-item.entity.js';
import { ProductVariant } from '../products/entities/product-variant.entity.js';
import { Payment } from '../payments/entities/payment.entity.js';

import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Order,
            OrderItem,
            ProductVariant,
            Payment,
        ]),
        InventoryModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule { }
