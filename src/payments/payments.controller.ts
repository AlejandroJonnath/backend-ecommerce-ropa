import {
    BadRequestException,
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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { UserRole } from '../users/entities/user.entity.js';

import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto.js';

import {
    PaymentStatus,
} from './entities/payment.entity.js';

import { PaymentsService } from './payments.service.js';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
    ) { }

    /**
     * Cliente crea un pago pendiente.
     */
    @Post('orders/:orderId')
    async createPayment(
        @Param(
            'orderId',
            new ParseUUIDPipe(),
        )
        orderId: string,
        @Body() dto: CreatePaymentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.paymentsService.createPayment(
            orderId,
            request.user.sub,
            dto,
        );
    }

    /**
     * Cliente consulta los pagos de su propia orden.
     */
    @Get('orders/:orderId')
    async getOrderPayments(
        @Param(
            'orderId',
            new ParseUUIDPipe(),
        )
        orderId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.paymentsService.getOrderPayments(
            orderId,
            request.user.sub,
        );
    }

    /**
     * Cliente consulta uno de sus propios pagos.
     *
     * El servicio valida ownership mediante order.user_id.
     */
    @Get(':paymentId')
    async getPayment(
        @Param(
            'paymentId',
            new ParseUUIDPipe(),
        )
        paymentId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.paymentsService.getPayment(
            paymentId,
            request.user.sub,
        );
    }

    /**
     * Listado global de pagos para administración.
     */
    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getPayments(
        @Query() query: QueryPaymentsDto,
    ) {
        return this.paymentsService.getPayments(
            query,
        );
    }

    /**
     * Confirma un pago pendiente.
     *
     * Solo ADMIN.
     */
    @Patch(':paymentId/confirm')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async confirmPayment(
        @Param(
            'paymentId',
            new ParseUUIDPipe(),
        )
        paymentId: string,
        @Body() dto: UpdatePaymentStatusDto,
        @Req() request: AuthenticatedRequest,
    ) {
        if (
            dto.status !== PaymentStatus.PAID
        ) {
            throw new BadRequestException(
                'Este endpoint solo permite confirmar pagos como PAID.',
            );
        }

        return this.paymentsService.confirmPayment(
            paymentId,
            request.user.sub,
            dto.notes ?? null,
        );
    }

    /**
     * Marca un pago como fallido y libera
     * las reservas de inventario.
     *
     * Solo ADMIN.
     */
    @Patch(':paymentId/fail')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async failPayment(
        @Param(
            'paymentId',
            new ParseUUIDPipe(),
        )
        paymentId: string,
        @Body() dto: UpdatePaymentStatusDto,
    ) {
        if (
            dto.status !== PaymentStatus.FAILED
        ) {
            throw new BadRequestException(
                'Este endpoint solo permite marcar pagos como FAILED.',
            );
        }

        return this.paymentsService.failPayment(
            paymentId,
            dto.notes ?? null,
        );
    }
}