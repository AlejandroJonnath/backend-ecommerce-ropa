import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import {
    CreateCategoryDto,
} from './dto/create-category.dto.js';

import {
    UpdateCategoryDto,
} from './dto/update-category.dto.js';

import {
    CategoriesService,
} from './categories.service.js';

import {
    JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard.js';

import {
    RolesGuard,
} from '../auth/guards/roles.guard.js';

import {
    Roles,
} from '../auth/decorators/roles.decorator.js';

import {
    UserRole,
} from '../users/entities/user.entity.js';

@Controller('categories')
export class CategoriesController {
    constructor(
        private readonly categoriesService:
            CategoriesService,
    ) { }

    /**
     * Lista todas las categorías para administración.
     *
     * Incluye activas e inactivas.
     *
     * Solo ADMIN.
     */
    @Get('admin/all')
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async findAllForAdmin() {
        return this.categoriesService.findAllForAdmin();
    }

    /**
     * Lista únicamente categorías activas.
     *
     * Endpoint público.
     */
    @Get()
    async findAll() {
        return this.categoriesService.findAll();
    }

    /**
     * Obtiene una categoría activa.
     *
     * Endpoint público.
     */
    @Get(':id')
    async findOne(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        id: string,
    ) {
        return this.categoriesService.findOne(
            id,
        );
    }

    /**
     * Crea una categoría.
     *
     * Solo ADMIN.
     */
    @Post()
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async create(
        @Body()
        dto: CreateCategoryDto,
    ) {
        return this.categoriesService.create(
            dto,
        );
    }

    /**
     * Actualiza una categoría.
     *
     * Solo ADMIN.
     */
    @Patch(':id')
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async update(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        id: string,

        @Body()
        dto: UpdateCategoryDto,
    ) {
        return this.categoriesService.update(
            id,
            dto,
        );
    }

    /**
     * Desactiva una categoría.
     *
     * Solo ADMIN.
     */
    @Patch(':id/deactivate')
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async deactivate(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        id: string,
    ) {
        return this.categoriesService.deactivate(
            id,
        );
    }

    /**
     * Reactiva una categoría.
     *
     * Solo ADMIN.
     */
    @Patch(':id/activate')
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async activate(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        id: string,
    ) {
        return this.categoriesService.activate(
            id,
        );
    }
}