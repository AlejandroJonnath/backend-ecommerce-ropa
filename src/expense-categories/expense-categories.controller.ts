
import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

import { ExpenseCategoriesService } from './expense-categories.service.js';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto.js';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto.js';
import { UpdateExpenseCategoryStatusDto } from './dto/update-expense-category-status.dto.js';
import { QueryExpenseCategoriesDto } from './dto/query-expense-categories.dto.js';

@Controller('expense-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ExpenseCategoriesController {
    constructor(
        private readonly expenseCategoriesService: ExpenseCategoriesService,
    ) { }

    @Post()
    create(@Body() dto: CreateExpenseCategoryDto) {
        return this.expenseCategoriesService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryExpenseCategoriesDto) {
        return this.expenseCategoriesService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.expenseCategoriesService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateExpenseCategoryDto,
    ) {
        return this.expenseCategoriesService.update(id, dto);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateExpenseCategoryStatusDto,
    ) {
        return this.expenseCategoriesService.updateStatus(id, dto);
    }
}
