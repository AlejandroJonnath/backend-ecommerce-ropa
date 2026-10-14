
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryModule } from '../inventory/inventory.module.js';
import { OrderItem } from '../order-items/entities/order-item.entity.js';
import { Order } from '../orders/entities/order.entity.js';

import { Payment } from './entities/payment.entity.js';
import { Refund } from './entities/refund.entity.js';

import { PaymentsController } from './payments.controller.js';
import { RefundsController } from './refunds.controller.js';

import { PaymentsService } from './payments.service.js';
import { RefundsService } from './refunds.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Payment,
            Refund,
            Order,
            OrderItem,
        ]),
        InventoryModule,
    ],
    controllers: [
        PaymentsController,
        RefundsController,
    ],
    providers: [
        PaymentsService,
        RefundsService,
    ],
    exports: [
        PaymentsService,
        RefundsService,
    ],
})
export class PaymentsModule { }
