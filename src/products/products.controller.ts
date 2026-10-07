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

import {
    CreateProductDto,
} from './dto/create-product.dto.js';

import {
    CreateProductVariantDto,
} from './dto/create-product-variant.dto.js';

import {
    QueryProductsDto,
} from './dto/query-products.dto.js';

import {
    UpdateProductDto,
} from './dto/update-product.dto.js';

import {
    UpdateProductVariantDto,
} from './dto/update-product-variant.dto.js';

import {
    ProductsService,
} from './products.service.js';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService:
            ProductsService,
    ) { }

    @Get('admin/all')
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async findAllForAdmin(
        @Query()
        query: QueryProductsDto,
    ) {
        return this.productsService.findAllForAdmin(
            query,
        );
    }

    @Get()
    async findAll(
        @Query()
        query: QueryProductsDto,
    ) {
        return this.productsService.findAll(
            query,
        );
    }

    @Get(':id/variants')
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async findVariants(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        productId: string,
    ) {
        return this.productsService.findVariants(
            productId,
        );
    }

    @Get(
        ':id/variants/:variantId',
    )
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async findVariant(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        productId: string,

        @Param(
            'variantId',
            new ParseUUIDPipe(),
        )
        variantId: string,
    ) {
        return this.productsService.findVariant(
            productId,
            variantId,
        );
    }

    @Get(':id')
    async findOne(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        id: string,
    ) {
        return this.productsService.findOne(
            id,
        );
    }

    @Post()
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async create(
        @Body()
        dto: CreateProductDto,
    ) {
        return this.productsService.create(
            dto,
        );
    }

    @Post(':id/variants')
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async createVariant(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        productId: string,

        @Body()
        dto: CreateProductVariantDto,
    ) {
        return this.productsService.createVariant(
            productId,
            dto,
        );
    }

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
        dto: UpdateProductDto,
    ) {
        return this.productsService.update(
            id,
            dto,
        );
    }

    @Patch(
        ':id/variants/:variantId',
    )
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async updateVariant(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        productId: string,

        @Param(
            'variantId',
            new ParseUUIDPipe(),
        )
        variantId: string,

        @Body()
        dto: UpdateProductVariantDto,
    ) {
        return this.productsService.updateVariant(
            productId,
            variantId,
            dto,
        );
    }

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
        return this.productsService.deactivate(
            id,
        );
    }

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
        return this.productsService.activate(
            id,
        );
    }

    @Patch(
        ':id/variants/:variantId/deactivate',
    )
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async deactivateVariant(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        productId: string,

        @Param(
            'variantId',
            new ParseUUIDPipe(),
        )
        variantId: string,
    ) {
        return this.productsService.deactivateVariant(
            productId,
            variantId,
        );
    }

    @Patch(
        ':id/variants/:variantId/activate',
    )
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async activateVariant(
        @Param(
            'id',
            new ParseUUIDPipe(),
        )
        productId: string,

        @Param(
            'variantId',
            new ParseUUIDPipe(),
        )
        variantId: string,
    ) {
        return this.productsService.activateVariant(
            productId,
            variantId,
        );
    }
}