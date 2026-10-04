import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Expense } from './entities/expense.entity.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Expense,
        ]),
    ],
    exports: [
        TypeOrmModule,
    ],
})
export class ExpensesModule { }