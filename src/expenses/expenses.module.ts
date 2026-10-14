
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Expense } from './entities/expense.entity.js';
import { ExpenseCategory } from '../expense-categories/entities/expense-category.entity.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Expense,
            ExpenseCategory,
        ]),
    ],
    controllers: [ExpensesController],
    providers: [ExpensesService],
    exports: [ExpensesService],
})
export class ExpensesModule { }
