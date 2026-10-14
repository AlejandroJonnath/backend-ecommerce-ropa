
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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { UserRole } from '../users/entities/user.entity.js';

import { CreateRefundDto } from './entities/create-refund.dto.js';
import { UpdateRefundStatusDto } from './entities/update-refund-status.dto.js';
import { RefundsService } from './refunds.service.js';

import { Req } from '@nestjs/common';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RefundsController {
    constructor(
        private readonly refundsService: RefundsService,
    ) { }

    /**
     * POST /payments/:paymentId/refunds
     * Registra una solicitud pendiente de reembolso.
     */
    @Post(':paymentId/refunds')
    async create(
        @Param('paymentId', new ParseUUIDPipe())
        paymentId: string,
        @Body() dto: CreateRefundDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.refundsService.create(
            paymentId,
            request.user.sub,
            dto,
        );
    }

    /**
     * GET /payments/:paymentId/refunds
     * Historial de reembolsos del pago.
     */
    @Get(':paymentId/refunds')
    async findByPayment(
        @Param('paymentId', new ParseUUIDPipe())
        paymentId: string,
    ) {
        return this.refundsService.findByPayment(paymentId);
    }

    /**
     * PATCH /payments/refunds/:refundId/status
     * Registra el resultado de una operación externa.
     */
    @Patch('refunds/:refundId/status')
    async updateStatus(
        @Param('refundId', new ParseUUIDPipe())
        refundId: string,
        @Body() dto: UpdateRefundStatusDto,
    ) {
        return this.refundsService.updateStatus(
            refundId,
            dto,
        );
    }
}
