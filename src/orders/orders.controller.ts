import {
    Body,
    Controller,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrdersService } from './orders.service.js';

import { JwtAuthGuard, } from '../auth/guards/jwt-auth.guard.js';

import { RolesGuard, } from '../auth/guards/roles.guard.js';

import { Roles, } from '../auth/decorators/roles.decorator.js';

import { JwtPayload, } from '../auth/types/jwt-payload.type.js';

import { UserRole, } from '../users/entities/user.entity.js';

type AuthenticatedRequest =
    Request & {
        user: JwtPayload;
    };

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async createOrder(
        @Req() request: AuthenticatedRequest,
        @Body() dto: CreateOrderDto,
    ) {
        const userId =
            request.user.sub;

        return this.ordersService.createOrder(
            userId,
            dto,
        );
    }

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