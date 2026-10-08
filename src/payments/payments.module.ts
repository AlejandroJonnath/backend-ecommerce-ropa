import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryModule } from '../inventory/inventory.module.js';
import { OrderItem } from '../order-items/entities/order-item.entity.js';
import { Order } from '../orders/entities/order.entity.js';

import { Payment } from './entities/payment.entity.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Payment,
            Order,
            OrderItem,
        ]),

        InventoryModule,
    ],

    controllers: [
        PaymentsController,
    ],

    providers: [
        PaymentsService,
    ],

    exports: [
        PaymentsService,
    ],
})
export class PaymentsModule { }