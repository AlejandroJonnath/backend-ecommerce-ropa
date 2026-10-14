
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExpenseCategory } from './entities/expense-category.entity.js';
import { ExpenseCategoriesController } from './expense-categories.controller.js';
import { ExpenseCategoriesService } from './expense-categories.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([ExpenseCategory])],
    controllers: [ExpenseCategoriesController],
    providers: [ExpenseCategoriesService],
    exports: [ExpenseCategoriesService],
})
export class ExpenseCategoriesModule { }
