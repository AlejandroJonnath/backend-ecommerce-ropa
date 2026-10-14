
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';

import {
    Payment,
    PaymentStatus,
} from './entities/payment.entity.js';

import {
    Refund,
    RefundStatus,
} from './entities/refund.entity.js';

import { CreateRefundDto } from './entities/create-refund.dto.js';
import { UpdateRefundStatusDto } from './entities/update-refund-status.dto.js';

@Injectable()
export class RefundsService {
    constructor(
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Registra una solicitud de reembolso pendiente.
     *
     * No mueve dinero ni cambia el pago a REFUNDED.
     */
    async create(
        paymentId: string,
        adminUserId: string,
        dto: CreateRefundDto,
    ): Promise<Refund> {
        return this.dataSource.transaction(async (manager) => {
            const paymentRepository = manager.getRepository(Payment);
            const refundRepository = manager.getRepository(Refund);

            const payment = await paymentRepository
                .createQueryBuilder('payment')
                .setLock('pessimistic_write')
                .where('payment.id = :paymentId', { paymentId })
                .getOne();

            if (!payment) {
                throw new NotFoundException('El pago no existe.');
            }

            if (
                payment.status !== PaymentStatus.PAID &&
                payment.status !== PaymentStatus.REFUNDED
            ) {
                throw new ConflictException(
                    'Solo se pueden reembolsar pagos confirmados.',
                );
            }

            const amount = new Decimal(dto.amount);

            if (!amount.isFinite() || amount.lte(0)) {
                throw new ConflictException(
                    'El importe del reembolso debe ser mayor que cero.',
                );
            }

            if (amount.decimalPlaces() > 2) {
                throw new ConflictException(
                    'El importe admite como máximo dos decimales.',
                );
            }

            const existingRefunds = await refundRepository.find({
                where: { paymentId },
            });

            const alreadyAllocated = existingRefunds
                .filter(
                    (refund) =>
                        refund.status === RefundStatus.PENDING ||
                        refund.status === RefundStatus.COMPLETED,
                )
                .reduce(
                    (total, refund) =>
                        total.plus(new Decimal(refund.amount)),
                    new Decimal(0),
                );

            const remaining = new Decimal(payment.amount)
                .minus(alreadyAllocated);

            if (amount.gt(remaining)) {
                throw new ConflictException(
                    `El importe supera el saldo reembolsable de ${remaining.toFixed(2)}.`,
                );
            }

            const refund = refundRepository.create({
                paymentId,
                amount: amount.toFixed(2),
                status: RefundStatus.PENDING,
                reason: dto.reason.trim(),
                externalReference:
                    dto.externalReference?.trim() || null,
                createdBy: adminUserId,
            });

            return refundRepository.save(refund);
        });
    }

    /**
     * Actualiza el resultado de un reembolso.
     *
     * COMPLETED debe utilizarse únicamente después de
     * confirmar el reembolso en el proveedor o banco.
     */
    async updateStatus(
        refundId: string,
        dto: UpdateRefundStatusDto,
    ): Promise<Refund> {
        return this.dataSource.transaction(async (manager) => {
            const refundRepository = manager.getRepository(Refund);
            const paymentRepository = manager.getRepository(Payment);

            // Lectura inicial para conocer el pago relacionado.
            const reference = await refundRepository.findOne({
                where: { id: refundId },
            });

            if (!reference) {
                throw new NotFoundException(
                    'El reembolso no existe.',
                );
            }

            // Mantener un orden de bloqueo consistente: pago y luego reembolso.
            const payment = await paymentRepository
                .createQueryBuilder('payment')
                .setLock('pessimistic_write')
                .where('payment.id = :paymentId', {
                    paymentId: reference.paymentId,
                })
                .getOne();

            if (!payment) {
                throw new NotFoundException(
                    'El pago asociado no existe.',
                );
            }

            const refund = await refundRepository
                .createQueryBuilder('refund')
                .setLock('pessimistic_write')
                .where('refund.id = :refundId', { refundId })
                .getOne();

            if (!refund) {
                throw new NotFoundException(
                    'El reembolso no existe.',
                );
            }

            if (refund.status !== RefundStatus.PENDING) {
                throw new ConflictException(
                    'Solo se pueden actualizar reembolsos pendientes.',
                );
            }

            if (dto.status === RefundStatus.PENDING) {
                throw new ConflictException(
                    'El reembolso ya se encuentra pendiente.',
                );
            }

            refund.status = dto.status;

            if (dto.externalReference?.trim()) {
                refund.externalReference =
                    dto.externalReference.trim();
            }

            if (dto.status === RefundStatus.COMPLETED) {
                if (!refund.externalReference) {
                    throw new ConflictException(
                        'Debes registrar la referencia externa del reembolso confirmado.',
                    );
                }

                /*
                 * Un pago solo se marca REFUNDED cuando todos
                 * sus importes reembolsados suman el pago original.
                 */
                const otherRefunds = await refundRepository.find({
                    where: { paymentId: payment.id },
                });

                const completedTotal = otherRefunds
                    .filter(
                        (item) =>
                            item.id !== refund.id &&
                            item.status === RefundStatus.COMPLETED,
                    )
                    .reduce(
                        (total, item) =>
                            total.plus(new Decimal(item.amount)),
                        new Decimal(0),
                    )
                    .plus(new Decimal(refund.amount));

                if (completedTotal.gt(new Decimal(payment.amount))) {
                    throw new ConflictException(
                        'El total reembolsado supera el importe del pago.',
                    );
                }

                if (completedTotal.equals(new Decimal(payment.amount))) {
                    payment.status = PaymentStatus.REFUNDED;
                    await paymentRepository.save(payment);
                }
            }

            return refundRepository.save(refund);
        });
    }

    /**
     * Historial de reembolsos de un pago.
     */
    async findByPayment(
        paymentId: string,
    ): Promise<Refund[]> {
        const paymentExists = await this.dataSource
            .getRepository(Payment)
            .exists({ where: { id: paymentId } });

        if (!paymentExists) {
            throw new NotFoundException(
                'El pago no existe.',
            );
        }

        return this.dataSource
            .getRepository(Refund)
            .find({
                where: { paymentId },
                order: { createdAt: 'DESC', id: 'DESC' },
            });
    }
}
