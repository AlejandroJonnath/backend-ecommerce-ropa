import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExpenseCategory } from './entities/expense-category.entity.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ExpenseCategory,
        ]),
    ],
    exports: [
        TypeOrmModule,
    ],
})
export class ExpenseCategoriesModule { }