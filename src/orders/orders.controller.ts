import {
    Body,
    Controller,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';

import { CreateOrderDto } from './dto/create-order.dto.js';

import { OrdersService } from './orders.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { RolesGuard } from '../auth/guards/roles.guard.js';

import { Roles } from '../auth/decorators/roles.decorator.js';


import { UserRole } from '../users/entities/user.entity.js';

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
    ) { }

    /**
     * Crea un pedido para el usuario autenticado.
     *
     * El userId NO viene del cliente.
     *
     * Se obtiene directamente del JWT.
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    async createOrder(
        @Req()
        request: AuthenticatedRequest,

        @Body()
        dto: CreateOrderDto,
    ) {
        const userId =
            request.user.sub;

        return this.ordersService.createOrder(
            userId,
            dto,
        );
    }

    /**
     * Endpoint temporal para comprobar
     * que el sistema de roles funciona.
     *
     * Posteriormente será reemplazado
     * por los endpoints administrativos reales.
     */
    @Post('admin-test')
    @UseGuards(
        JwtAuthGuard,
        RolesGuard,
    )
    @Roles(UserRole.ADMIN)
    async adminTest() {
        return {
            message:
                'Acceso administrativo autorizado.',
        };
    }
}