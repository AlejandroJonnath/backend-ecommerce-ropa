import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { getDatabaseConfig } from './config/database.config.js';

import { UsersModule } from './users/users.module.js';
import { AddressesModule } from './addresses/addresses.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { SizesModule } from './sizes/sizes.module.js';
import { ColorsModule } from './colors/colors.module.js';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { OrderItemsModule } from './order-items/order-items.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { InventoryModule } from './inventory/inventory.module.js';

import { AppController } from './app.controller.js';

import { AppService } from './app.service.js';




@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, //cada 60s por cliente
          limit: 100,//100 request
        },
      ],
    }),

    UsersModule,
    AddressesModule,
    CategoriesModule,
    SizesModule,
    ColorsModule,
    ProductsModule,

    OrdersModule,
    OrderItemsModule,
    PaymentsModule,
    ExpenseCategoriesModule,
    ExpensesModule,

    InventoryModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule { }