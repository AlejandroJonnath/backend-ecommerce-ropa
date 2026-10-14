
import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../users/entities/user.entity.js';

import { QueryAdminOrdersDto } from '../dto/query-admin-orders.dto.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import { AdminOrdersService } from '../services/admin-orders.service.js';

@Controller('orders/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminOrdersController {
    constructor(
        private readonly adminOrdersService: AdminOrdersService,
    ) { }

    /**
     * GET /orders/admin/all?page=1&limit=20
     */
    @Get('all')
    async findAll(
        @Query() query: QueryAdminOrdersDto,
    ) {
        return this.adminOrdersService.findAll(query);
    }

    /**
     * PATCH /orders/admin/:orderId/status
     */
    @Patch(':orderId/status')
    async updateStatus(
        @Param(
            'orderId',
            new ParseUUIDPipe(),
        )
        orderId: string,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        return this.adminOrdersService.updateStatus(
            orderId,
            dto.status,
        );
    }
}
