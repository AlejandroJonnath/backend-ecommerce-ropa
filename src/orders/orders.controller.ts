
import {
    Body,
    Controller,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { UserRole } from '../users/entities/user.entity.js';

import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
    ) { }

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
     * Cancela una orden pendiente perteneciente al cliente.
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
