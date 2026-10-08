import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, EntityManager, Repository } from 'typeorm';

import { Decimal } from 'decimal.js';

import { InventoryService } from '../inventory/inventory.service.js';

import {
    Order,
    OrderStatus,
} from '../orders/entities/order.entity.js';

import { OrderItem } from '../order-items/entities/order-item.entity.js';

import {
    Payment,
    PaymentStatus,
} from './entities/payment.entity.js';

import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly dataSource: DataSource,

        private readonly inventoryService: InventoryService,

        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,

        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,

        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
    ) { }

    async createPayment(
        orderId: string,
        userId: string,
        dto: CreatePaymentDto,
    ): Promise<Payment> {
        return this.dataSource.transaction(
            async (manager) => {
                const order = await manager
                    .getRepository(Order)
                    .createQueryBuilder('order')
                    .setLock('pessimistic_write')
                    .where('order.id = :orderId', {
                        orderId,
                    })
                    .andWhere('order.user_id = :userId', {
                        userId,
                    })
                    .getOne();

                if (!order) {
                    throw new NotFoundException(
                        'La orden no existe.',
                    );
                }

                if (
                    order.status ===
                    OrderStatus.CANCELLED
                ) {
                    throw new ConflictException(
                        'No puedes pagar una orden cancelada.',
                    );
                }

                if (
                    order.status ===
                    OrderStatus.DELIVERED
                ) {
                    throw new ConflictException(
                        'La orden ya fue entregada.',
                    );
                }

                const existingPaidPayment =
                    await manager
                        .getRepository(Payment)
                        .findOne({
                            where: {
                                orderId,
                                status: PaymentStatus.PAID,
                            },
                        });

                if (existingPaidPayment) {
                    throw new ConflictException(
                        'La orden ya tiene un pago confirmado.',
                    );
                }

                const existingPendingPayment =
                    await manager
                        .getRepository(Payment)
                        .findOne({
                            where: {
                                orderId,
                                status: PaymentStatus.PENDING,
                            },
                        });

                if (existingPendingPayment) {
                    throw new ConflictException(
                        'La orden ya tiene un pago pendiente.',
                    );
                }

                const payment =
                    manager
                        .getRepository(Payment)
                        .create({
                            orderId,
                            amount: order.total,
                            method: dto.method,
                            status:
                                PaymentStatus.PENDING,
                            externalReference:
                                dto.externalReference ??
                                null,
                            notes:
                                dto.notes?.trim() ?? null,
                        });

                return manager
                    .getRepository(Payment)
                    .save(payment);
            },
        );
    }

    async confirmPayment(
        paymentId: string,
        adminUserId: string,
        notes: string | null = null,
    ): Promise<Payment> {
        return this.dataSource.transaction(
            async (manager) => {
                const payment =
                    await manager
                        .getRepository(Payment)
                        .createQueryBuilder('payment')
                        .setLock('pessimistic_write')
                        .where('payment.id = :paymentId', {
                            paymentId,
                        })
                        .getOne();

                if (!payment) {
                    throw new NotFoundException(
                        'El pago no existe.',
                    );
                }

                if (
                    payment.status ===
                    PaymentStatus.PAID
                ) {
                    throw new ConflictException(
                        'El pago ya fue confirmado.',
                    );
                }

                if (
                    payment.status !==
                    PaymentStatus.PENDING
                ) {
                    throw new ConflictException(
                        'Solo se pueden confirmar pagos pendientes.',
                    );
                }

                const order =
                    await manager
                        .getRepository(Order)
                        .createQueryBuilder('order')
                        .setLock('pessimistic_write')
                        .where('order.id = :orderId', {
                            orderId: payment.orderId,
                        })
                        .getOne();

                if (!order) {
                    throw new NotFoundException(
                        'La orden asociada al pago no existe.',
                    );
                }

                if (
                    order.status ===
                    OrderStatus.CANCELLED
                ) {
                    throw new ConflictException(
                        'No puedes confirmar el pago de una orden cancelada.',
                    );
                }

                const orderItems =
                    await manager
                        .getRepository(OrderItem)
                        .find({
                            where: {
                                orderId: order.id,
                            },
                            relations: {
                                productVariant: true,
                            },
                        });

                if (orderItems.length === 0) {
                    throw new ConflictException(
                        'La orden no contiene productos.',
                    );
                }

                const expectedTotal =
                    orderItems.reduce(
                        (
                            total,
                            item,
                        ) =>
                            total.plus(
                                new Decimal(
                                    item.subtotal,
                                ),
                            ),
                        new Decimal(0),
                    );

                const orderTotal =
                    new Decimal(order.total);

                if (
                    !expectedTotal.equals(
                        orderTotal,
                    )
                ) {
                    throw new ConflictException(
                        'El total de la orden no coincide con sus productos.',
                    );
                }

                for (const item of orderItems) {
                    await this.inventoryService.confirmReservedStock(
                        manager,
                        item.productVariantId,
                        item.quantity,
                        adminUserId,
                        order.id,
                        'Venta confirmada mediante pago.',
                    );
                }

                payment.status =
                    PaymentStatus.PAID;

                if (notes !== null) {
                    payment.notes =
                        notes.trim();
                }

                order.status =
                    OrderStatus.CONFIRMED;

                await manager
                    .getRepository(Order)
                    .save(order);

                return manager
                    .getRepository(Payment)
                    .save(payment);
            },
        );
    }

    async failPayment(
        paymentId: string,
        notes: string | null = null,
    ): Promise<Payment> {
        return this.dataSource.transaction(
            async (manager) => {
                const payment =
                    await manager
                        .getRepository(Payment)
                        .createQueryBuilder('payment')
                        .setLock('pessimistic_write')
                        .where('payment.id = :paymentId', {
                            paymentId,
                        })
                        .getOne();

                if (!payment) {
                    throw new NotFoundException(
                        'El pago no existe.',
                    );
                }

                if (
                    payment.status !==
                    PaymentStatus.PENDING
                ) {
                    throw new ConflictException(
                        'Solo se pueden marcar como fallidos los pagos pendientes.',
                    );
                }

                payment.status =
                    PaymentStatus.FAILED;

                if (notes !== null) {
                    payment.notes =
                        notes.trim();
                }

                return manager
                    .getRepository(Payment)
                    .save(payment);
            },
        );
    }

    async getPayment(
        paymentId: string,
    ): Promise<Payment> {
        const payment =
            await this.paymentRepository.findOne({
                where: {
                    id: paymentId,
                },
                relations: {
                    order: true,
                },
            });

        if (!payment) {
            throw new NotFoundException(
                'El pago no existe.',
            );
        }

        return payment;
    }

    async getOrderPayments(
        orderId: string,
        userId?: string,
    ): Promise<Payment[]> {
        const queryBuilder =
            this.paymentRepository
                .createQueryBuilder('payment')
                .where(
                    'payment.order_id = :orderId',
                    {
                        orderId,
                    },
                );

        if (userId) {
            queryBuilder
                .innerJoin(
                    'payment.order',
                    'order',
                )
                .andWhere(
                    'order.user_id = :userId',
                    {
                        userId,
                    },
                );
        }

        return queryBuilder
            .orderBy(
                'payment.created_at',
                'DESC',
            )
            .getMany();
    }

    async getPayments(
        query: QueryPaymentsDto,
    ) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const queryBuilder =
            this.paymentRepository
                .createQueryBuilder('payment')
                .leftJoinAndSelect(
                    'payment.order',
                    'order',
                );

        if (query.status) {
            queryBuilder.andWhere(
                'payment.status = :status',
                {
                    status: query.status,
                },
            );
        }

        queryBuilder
            .orderBy(
                'payment.created_at',
                'DESC',
            )
            .addOrderBy(
                'payment.id',
                'DESC',
            )
            .skip(skip)
            .take(limit);

        const [payments, total] =
            await queryBuilder
                .getManyAndCount();

        return {
            data: payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(
                    total / limit,
                ),
                hasNextPage:
                    page <
                    Math.ceil(
                        total / limit,
                    ),
                hasPreviousPage:
                    page > 1,
            },
        };
    }
}