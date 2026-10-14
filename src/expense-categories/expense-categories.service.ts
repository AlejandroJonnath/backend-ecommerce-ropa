
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { ExpenseCategory } from './entities/expense-category.entity.js';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto.js';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto.js';
import { UpdateExpenseCategoryStatusDto } from './dto/update-expense-category-status.dto.js';
import { QueryExpenseCategoriesDto } from './dto/query-expense-categories.dto.js';

@Injectable()
export class ExpenseCategoriesService {
    constructor(
        @InjectRepository(ExpenseCategory)
        private readonly categoriesRepository: Repository<ExpenseCategory>,
    ) { }

    async create(
        dto: CreateExpenseCategoryDto,
    ): Promise<ExpenseCategory> {
        const category = this.categoriesRepository.create({
            name: dto.name.trim(),
            slug: dto.slug.trim(),
            description: dto.description?.trim() || null,
            isActive: true,
        });

        try {
            return await this.categoriesRepository.save(category);
        } catch (error: unknown) {
            this.handleDatabaseError(error);
        }
    }

    async findAll(query: QueryExpenseCategoriesDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const queryBuilder = this.categoriesRepository
            .createQueryBuilder('category');

        if (query.isActive !== undefined) {
            queryBuilder.andWhere('category.isActive = :isActive', {
                isActive: query.isActive,
            });
        }

        queryBuilder
            .orderBy('category.name', 'ASC')
            .addOrderBy('category.id', 'ASC')
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

    async findOne(id: string): Promise<ExpenseCategory> {
        const category = await this.categoriesRepository.findOne({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException(
                'La categoría de gastos no existe.',
            );
        }

        return category;
    }

    async update(
        id: string,
        dto: UpdateExpenseCategoryDto,
    ): Promise<ExpenseCategory> {
        const category = await this.findOne(id);

        if (dto.name !== undefined) {
            category.name = dto.name.trim();
        }

        if (dto.slug !== undefined) {
            category.slug = dto.slug.trim();
        }

        if (dto.description !== undefined) {
            category.description = dto.description?.trim() || null;
        }

        try {
            return await this.categoriesRepository.save(category);
        } catch (error: unknown) {
            this.handleDatabaseError(error);
        }
    }

    async updateStatus(
        id: string,
        dto: UpdateExpenseCategoryStatusDto,
    ): Promise<ExpenseCategory> {
        const category = await this.findOne(id);

        category.isActive = dto.isActive;

        return this.categoriesRepository.save(category);
    }

    private handleDatabaseError(error: unknown): never {
        if (
            error instanceof QueryFailedError &&
            (
                error as QueryFailedError & {
                    driverError?: { code?: string };
                }
            ).driverError?.code === '23505'
        ) {
            throw new ConflictException(
                'Ya existe una categoría con ese nombre o slug único.',
            );
        }

        throw error;
    }
}
