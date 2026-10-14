
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Decimal } from 'decimal.js';
import { Repository } from 'typeorm';

import { Expense } from './entities/expense.entity.js';
import { ExpenseCategory } from '../expense-categories/entities/expense-category.entity.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { QueryExpensesDto } from './dto/query-expenses.dto.js';

@Injectable()
export class ExpensesService {
    constructor(
        @InjectRepository(Expense)
        private readonly expensesRepository: Repository<Expense>,

        @InjectRepository(ExpenseCategory)
        private readonly categoriesRepository: Repository<ExpenseCategory>,
    ) { }

    async create(dto: CreateExpenseDto): Promise<Expense> {
        this.validateAmount(dto.amount);
        this.validateDateRange(dto.expenseDate, dto.expenseDate);

        const category = await this.findActiveCategory(dto.categoryId);

        const expense = this.expensesRepository.create({
            categoryId: category.id,
            description: dto.description.trim(),
            amount: new Decimal(dto.amount).toFixed(2),
            expenseDate: dto.expenseDate,
            notes: dto.notes?.trim() || null,
        });

        return this.expensesRepository.save(expense);
    }

    async findAll(query: QueryExpensesDto) {
        this.validateDateRange(query.startDate, query.endDate);

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const queryBuilder = this.expensesRepository
            .createQueryBuilder('expense')
            .leftJoinAndSelect('expense.category', 'category');

        if (query.categoryId) {
            queryBuilder.andWhere(
                'expense.categoryId = :categoryId',
                { categoryId: query.categoryId },
            );
        }

        if (query.startDate) {
            queryBuilder.andWhere(
                'expense.expenseDate >= :startDate',
                { startDate: query.startDate },
            );
        }

        if (query.endDate) {
            queryBuilder.andWhere(
                'expense.expenseDate <= :endDate',
                { endDate: query.endDate },
            );
        }

        queryBuilder
            .orderBy('expense.expenseDate', 'DESC')
            .addOrderBy('expense.createdAt', 'DESC')
            .addOrderBy('expense.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<Expense> {
        const expense = await this.expensesRepository.findOne({
            where: { id },
            relations: { category: true },
        });

        if (!expense) {
            throw new NotFoundException('El gasto no existe.');
        }

        return expense;
    }

    async update(
        id: string,
        dto: UpdateExpenseDto,
    ): Promise<Expense> {
        const expense = await this.findOne(id);

        if (dto.amount !== undefined) {
            this.validateAmount(dto.amount);
            expense.amount = new Decimal(dto.amount).toFixed(2);
        }

        if (dto.categoryId !== undefined) {
            const category = await this.findActiveCategory(dto.categoryId);
            expense.categoryId = category.id;
        }

        if (dto.description !== undefined) {
            expense.description = dto.description.trim();
        }

        if (dto.expenseDate !== undefined) {
            expense.expenseDate = dto.expenseDate;
        }

        if (dto.notes !== undefined) {
            expense.notes = dto.notes?.trim() || null;
        }

        return this.expensesRepository.save(expense);
    }

    async remove(id: string): Promise<{ message: string }> {
        const expense = await this.expensesRepository.findOne({
            where: { id },
        });

        if (!expense) {
            throw new NotFoundException('El gasto no existe.');
        }

        await this.expensesRepository.remove(expense);

        return { message: 'El gasto se eliminó correctamente.' };
    }

    private async findActiveCategory(
        categoryId: string,
    ): Promise<ExpenseCategory> {
        const category = await this.categoriesRepository.findOne({
            where: {
                id: categoryId,
                isActive: true,
            },
        });

        if (!category) {
            throw new ConflictException(
                'La categoría no existe o está inactiva.',
            );
        }

        return category;
    }

    private validateAmount(amount: string): void {
        const value = new Decimal(amount);

        if (!value.isFinite() || value.lte(0)) {
            throw new BadRequestException(
                'El importe del gasto debe ser mayor que cero.',
            );
        }

        if (value.decimalPlaces() > 2) {
            throw new BadRequestException(
                'El importe admite como máximo dos decimales.',
            );
        }
    }

    private validateDateRange(
        startDate?: string,
        endDate?: string,
    ): void {
        if (startDate && endDate && startDate > endDate) {
            throw new BadRequestException(
                'La fecha inicial no puede ser posterior a la fecha final.',
            );
        }
    }
}
