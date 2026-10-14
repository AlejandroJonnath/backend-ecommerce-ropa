
import {
    Body,
    Controller,
    Delete,
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

import { ExpensesService } from './expenses.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { QueryExpensesDto } from './dto/query-expenses.dto.js';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ExpensesController {
    constructor(
        private readonly expensesService: ExpensesService,
    ) { }

    @Post()
    create(@Body() dto: CreateExpenseDto) {
        return this.expensesService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryExpensesDto) {
        return this.expensesService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.expensesService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateExpenseDto,
    ) {
        return this.expensesService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.expensesService.remove(id);
    }
}
