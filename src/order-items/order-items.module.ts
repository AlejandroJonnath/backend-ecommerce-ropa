import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrderItem } from './entities/order-item.entity.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            OrderItem,
        ]),
    ],
    exports: [
        TypeOrmModule,
    ],
})
export class OrderItemsModule { }