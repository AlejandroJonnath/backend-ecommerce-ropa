import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { UserRole } from '../users/entities/user.entity.js';

import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto.js';
import { CreateInventoryDamageDto } from './dto/create-inventory-damage.dto.js';
import { CreateInventoryPurchaseDto } from './dto/create-inventory-purchase.dto.js';
import { CreateInventoryReturnDto } from './dto/create-inventory-return.dto.js';
import { QueryInventoryMovementsDto } from './dto/query-inventory-movements.dto.js';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InventoryController {
    constructor(
        private readonly inventoryService: InventoryService,
    ) { }

    @Post(':variantId/purchase')
    async purchase(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Body() dto: CreateInventoryPurchaseDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.inventoryService.createPurchase(
            variantId,
            dto.quantity,
            request.user.sub,
            dto.referenceId ?? null,
            dto.reason?.trim() ?? null,
        );
    }

    @Post(':variantId/return')
    async returnStock(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Body() dto: CreateInventoryReturnDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.inventoryService.createReturn(
            variantId,
            dto.quantity,
            request.user.sub,
            dto.referenceId ?? null,
            dto.reason?.trim() ?? null,
        );
    }

    @Post(':variantId/damage')
    async damage(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Body() dto: CreateInventoryDamageDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.inventoryService.createDamage(
            variantId,
            dto.quantity,
            request.user.sub,
            dto.referenceId ?? null,
            dto.reason?.trim() ?? null,
        );
    }

    @Post(':variantId/adjustment')
    async adjustment(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Body() dto: CreateInventoryAdjustmentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.inventoryService.createAdjustment(
            variantId,
            dto.quantity,
            request.user.sub,
            dto.referenceId ?? null,
            dto.reason.trim(),
        );
    }

    @Get(':variantId')
    async getVariantInventory(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
    ) {
        return this.inventoryService.getVariantInventory(
            variantId,
        );
    }

    @Get(':variantId/movements')
    async getMovements(
        @Param('variantId', new ParseUUIDPipe()) variantId: string,
        @Query() query: QueryInventoryMovementsDto,
    ) {
        return this.inventoryService.getMovements(
            variantId,
            query,
        );
    }
}