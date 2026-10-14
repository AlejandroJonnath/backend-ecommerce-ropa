
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import {
    Order,
    OrderStatus,
} from '../entities/order.entity.js';

import { QueryAdminOrdersDto } from '../dto/query-admin-orders.dto.js';

@Injectable()
export class AdminOrdersService {
    constructor(
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Lista órdenes para administración.
     * Incluye filtros y paginación.
     */
    async findAll(query: QueryAdminOrdersDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const queryBuilder = this.dataSource
            .getRepository(Order)
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items');

        if (query.status) {
            queryBuilder.andWhere(
                'order.status = :status',
                { status: query.status },
            );
        }

        if (query.userId) {
            queryBuilder.andWhere(
                'order.user_id = :userId',
                { userId: query.userId },
            );
        }

        queryBuilder
            .orderBy('order.created_at', 'DESC')
            .addOrderBy('order.id', 'DESC')
            .skip(skip)
            .take(limit);

        const [orders, total] =
            await queryBuilder.getManyAndCount();

        return {
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    /**
     * Avanza una orden por las transiciones permitidas.
     *
     * Las órdenes pendientes solo se confirman mediante
     * el flujo de confirmación del pago.
     */
    async updateStatus(
        orderId: string,
        nextStatus: OrderStatus,
    ): Promise<Order> {
        const allowedTransitions: Partial<
            Record<OrderStatus, OrderStatus[]>
        > = {
            [OrderStatus.CONFIRMED]: [
                OrderStatus.PROCESSING,
            ],
            [OrderStatus.PROCESSING]: [
                OrderStatus.SHIPPED,
            ],
            [OrderStatus.SHIPPED]: [
                OrderStatus.DELIVERED,
            ],
        };

        return this.dataSource.transaction(async (manager) => {
            const orderRepository =
                manager.getRepository(Order);

            const order = await orderRepository
                .createQueryBuilder('order')
                .setLock('pessimistic_write')
                .where('order.id = :orderId', { orderId })
                .getOne();

            if (!order) {
                throw new NotFoundException(
                    'La orden no existe.',
                );
            }

            const allowedNextStatuses =
                allowedTransitions[order.status] ?? [];

            if (!allowedNextStatuses.includes(nextStatus)) {
                throw new ConflictException(
                    `No se permite cambiar la orden de ${order.status} a ${nextStatus}.`,
                );
            }

            order.status = nextStatus;

            await orderRepository.save(order);

            const updatedOrder = await orderRepository
                .createQueryBuilder('order')
                .leftJoinAndSelect('order.items', 'items')
                .where('order.id = :orderId', {
                    orderId,
                })
                .getOne();

            if (!updatedOrder) {
                throw new NotFoundException(
                    'No se encontró la orden actualizada.',
                );
            }

            return updatedOrder;
        });
    }
}
