import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';

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

    /**
     * Crea un pago pendiente para una orden.
     *
     * El importe NO viene desde el frontend.
     * Siempre se toma directamente de order.total.
     */
    async createPayment(
        orderId: string,
        userId: string,
        dto: CreatePaymentDto,
    ): Promise<Payment> {
        return this.dataSource.transaction(async (manager) => {
            const order = await manager
                .getRepository(Order)
                .createQueryBuilder('order')
                .setLock('pessimistic_write')
                .where('order.id = :orderId', { orderId })
                .andWhere('order.user_id = :userId', { userId })
                .getOne();

            if (!order) {
                throw new NotFoundException(
                    'La orden no existe.',
                );
            }

            if (order.status === OrderStatus.CANCELLED) {
                throw new ConflictException(
                    'No puedes pagar una orden cancelada.',
                );
            }

            if (order.status !== OrderStatus.PENDING) {
                throw new ConflictException(
                    'Solo se pueden pagar órdenes pendientes.',
                );
            }

            const paymentRepository =
                manager.getRepository(Payment);

            const existingPaidPayment =
                await paymentRepository.findOne({
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
                await paymentRepository.findOne({
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

            const payment = paymentRepository.create({
                orderId,
                amount: order.total,
                method: dto.method,
                status: PaymentStatus.PENDING,
                externalReference:
                    dto.externalReference?.trim() ?? null,
                notes: dto.notes?.trim() ?? null,
            });

            return paymentRepository.save(payment);
        });
    }

    /**
     * Confirma un pago pendiente.
     *
     * Flujo:
     *
     * 1. Obtiene la orden asociada.
     * 2. Bloquea la orden.
     * 3. Bloquea el pago.
     * 4. Valida totales.
     * 5. Confirma las reservas de inventario.
     * 6. Registra movimientos SALE.
     * 7. Marca el pago como PAID.
     * 8. Marca la orden como CONFIRMED.
     *
     * Todo ocurre dentro de una única transacción.
     */
    async confirmPayment(
        paymentId: string,
        adminUserId: string,
        notes: string | null = null,
    ): Promise<Payment> {
        return this.dataSource.transaction(async (manager) => {
            const paymentRepository =
                manager.getRepository(Payment);

            const orderRepository =
                manager.getRepository(Order);

            const orderItemRepository =
                manager.getRepository(OrderItem);

            /*
             * Primero obtenemos el pago sin lock únicamente
             * para conocer la orden asociada.
             *
             * Después bloqueamos primero la orden y luego
             * el pago para mantener un orden consistente
             * de locks y reducir riesgos de deadlocks.
             */
            const paymentReference =
                await paymentRepository.findOne({
                    where: {
                        id: paymentId,
                    },
                });

            if (!paymentReference) {
                throw new NotFoundException(
                    'El pago no existe.',
                );
            }

            const order = await orderRepository
                .createQueryBuilder('order')
                .setLock('pessimistic_write')
                .where('order.id = :orderId', {
                    orderId: paymentReference.orderId,
                })
                .getOne();

            if (!order) {
                throw new NotFoundException(
                    'La orden asociada al pago no existe.',
                );
            }

            const payment = await paymentRepository
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

            if (payment.status === PaymentStatus.PAID) {
                throw new ConflictException(
                    'El pago ya fue confirmado.',
                );
            }

            if (payment.status !== PaymentStatus.PENDING) {
                throw new ConflictException(
                    'Solo se pueden confirmar pagos pendientes.',
                );
            }

            if (order.status === OrderStatus.CANCELLED) {
                throw new ConflictException(
                    'No puedes confirmar el pago de una orden cancelada.',
                );
            }

            if (order.status !== OrderStatus.PENDING) {
                throw new ConflictException(
                    'La orden ya no se encuentra pendiente.',
                );
            }

            /*
             * El importe almacenado en el pago debe coincidir
             * con el total actual de la orden.
             *
             * Decimal evita errores de precisión con dinero.
             */
            const paymentAmount = new Decimal(
                payment.amount,
            );

            const orderTotal = new Decimal(
                order.total,
            );

            if (!paymentAmount.equals(orderTotal)) {
                throw new ConflictException(
                    'El importe del pago no coincide con el total de la orden.',
                );
            }

            const orderItems =
                await orderItemRepository.find({
                    where: {
                        orderId: order.id,
                    },
                });

            if (orderItems.length === 0) {
                throw new ConflictException(
                    'La orden no contiene productos.',
                );
            }

            /*
             * Los items deben bloquearse siempre en el mismo
             * orden por variantId para reducir deadlocks.
             */
            orderItems.sort((a, b) =>
                a.productVariantId.localeCompare(
                    b.productVariantId,
                ),
            );

            /*
             * Verificamos que la suma de los items coincida
             * con el subtotal registrado en la orden.
             */
            const calculatedSubtotal =
                orderItems.reduce(
                    (total, item) =>
                        total.plus(
                            new Decimal(item.subtotal),
                        ),
                    new Decimal(0),
                );

            const orderSubtotal = new Decimal(
                order.subtotal,
            );

            if (!calculatedSubtotal.equals(orderSubtotal)) {
                throw new ConflictException(
                    'El subtotal de la orden no coincide con sus productos.',
                );
            }

            /*
             * Validamos:
             *
             * subtotal
             * - descuento
             * + envío
             * = total
             */
            const discount = new Decimal(
                order.discount,
            );

            const shippingCost = new Decimal(
                order.shippingCost,
            );

            const calculatedTotal = calculatedSubtotal
                .minus(discount)
                .plus(shippingCost);

            if (!calculatedTotal.equals(orderTotal)) {
                throw new ConflictException(
                    'El total de la orden no coincide con sus valores calculados.',
                );
            }

            /*
             * Confirmamos cada reserva.
             *
             * InventoryService vuelve a bloquear cada variante
             * con pessimistic_write.
             */
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

            payment.status = PaymentStatus.PAID;

            if (notes !== null) {
                payment.notes = notes.trim();
            }

            order.status = OrderStatus.CONFIRMED;

            await orderRepository.save(order);

            return paymentRepository.save(payment);
        });
    }

    /**
     * Marca un pago como fallido y libera todas
     * las reservas de inventario de la orden.
     */
    async failPayment(
        paymentId: string,
        notes: string | null = null,
    ): Promise<Payment> {
        return this.dataSource.transaction(async (manager) => {
            const paymentRepository =
                manager.getRepository(Payment);

            const orderRepository =
                manager.getRepository(Order);

            const orderItemRepository =
                manager.getRepository(OrderItem);

            /*
             * Primero obtenemos el pago para conocer la orden.
             */
            const paymentReference =
                await paymentRepository.findOne({
                    where: {
                        id: paymentId,
                    },
                });

            if (!paymentReference) {
                throw new NotFoundException(
                    'El pago no existe.',
                );
            }

            /*
             * Bloqueamos primero la orden.
             */
            const order = await orderRepository
                .createQueryBuilder('order')
                .setLock('pessimistic_write')
                .where('order.id = :orderId', {
                    orderId: paymentReference.orderId,
                })
                .getOne();

            if (!order) {
                throw new NotFoundException(
                    'La orden asociada al pago no existe.',
                );
            }

            /*
             * Después bloqueamos el pago.
             */
            const payment = await paymentRepository
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

            if (payment.status === PaymentStatus.FAILED) {
                throw new ConflictException(
                    'El pago ya fue marcado como fallido.',
                );
            }

            if (payment.status !== PaymentStatus.PENDING) {
                throw new ConflictException(
                    'Solo se pueden marcar como fallidos los pagos pendientes.',
                );
            }

            if (order.status !== OrderStatus.PENDING) {
                throw new ConflictException(
                    'La orden ya no se encuentra pendiente.',
                );
            }

            const orderItems =
                await orderItemRepository.find({
                    where: {
                        orderId: order.id,
                    },
                });

            /*
             * Mismo orden de locks utilizado por creación
             * y confirmación de órdenes.
             */
            orderItems.sort((a, b) =>
                a.productVariantId.localeCompare(
                    b.productVariantId,
                ),
            );

            /*
             * Liberamos las reservas.
             *
             * No reducimos stock físico porque el producto
             * nunca llegó a salir del inventario.
             */
            for (const item of orderItems) {
                await this.inventoryService.releaseReservedStock(
                    manager,
                    item.productVariantId,
                    item.quantity,
                );
            }

            payment.status = PaymentStatus.FAILED;

            if (notes !== null) {
                payment.notes = notes.trim();
            }

            return paymentRepository.save(payment);
        });
    }

    /**
     * Obtiene un pago perteneciente al usuario autenticado.
     */
    async getPayment(
        paymentId: string,
        userId: string,
    ): Promise<Payment> {
        const payment = await this.paymentRepository
            .createQueryBuilder('payment')
            .innerJoinAndSelect(
                'payment.order',
                'order',
            )
            .where('payment.id = :paymentId', {
                paymentId,
            })
            .andWhere('order.user_id = :userId', {
                userId,
            })
            .getOne();

        if (!payment) {
            throw new NotFoundException(
                'El pago no existe.',
            );
        }

        return payment;
    }

    /**
     * Obtiene los pagos de una orden.
     *
     * Si userId existe, se verifica que la orden
     * pertenezca al usuario.
     */
    async getOrderPayments(
        orderId: string,
        userId?: string,
    ): Promise<Payment[]> {
        const queryBuilder = this.paymentRepository
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
            .addOrderBy(
                'payment.id',
                'DESC',
            )
            .getMany();
    }

    /**
     * Listado administrativo de pagos.
     */
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
            await queryBuilder.getManyAndCount();

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
                    Math.ceil(total / limit),
                hasPreviousPage:
                    page > 1,
            },
        };
    }
}