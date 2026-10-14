
import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request.type.js';
import { UserRole } from '../../users/entities/user.entity.js';

import { CreateOrderDto } from '../dto/create-order.dto.js';
import { QueryOrdersDto } from '../dto/query-orders.dto.js';
import { OrdersService } from '../services/orders.service.js';

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
    ) { }

    /**
     * Historial del cliente autenticado.
     *
     * Ejemplo:
     * GET /orders/me?page=1&limit=20
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMyOrders(
        @Req() request: AuthenticatedRequest,
        @Query() query: QueryOrdersDto,
    ) {
        return this.ordersService.getMyOrders(
            request.user.sub,
            query,
        );
    }

    /**
     * Detalle de una orden propia.
     */
    @Get('me/:orderId')
    @UseGuards(JwtAuthGuard)
    async getMyOrder(
        @Param(
            'orderId',
            new ParseUUIDPipe(),
        )
        orderId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.ordersService.getMyOrder(
            orderId,
            request.user.sub,
        );
    }

    /**
     * Crea una orden para el cliente autenticado.
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    async createOrder(
        @Req() request: AuthenticatedRequest,
        @Body() dto: CreateOrderDto,
    ) {
        return this.ordersService.createOrder(
            request.user.sub,
            dto,
        );
    }

    /**
     * Cancela una orden pendiente propia.
     */
    @Patch(':orderId/cancel')
    @UseGuards(JwtAuthGuard)
    async cancelOrder(
        @Param(
            'orderId',
            new ParseUUIDPipe(),
        )
        orderId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.ordersService.cancelOrder(
            orderId,
            request.user.sub,
        );
    }

    /**
     * Endpoint temporal para comprobar el acceso administrativo.
     */
    @Post('admin-test')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async adminTest() {
        return {
            message: 'Acceso administrativo autorizado.',
        };
    }
}
