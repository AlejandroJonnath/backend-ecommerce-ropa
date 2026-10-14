
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { DataSource, EntityManager } from 'typeorm';
import { Decimal } from 'decimal.js';

import { InventoryService } from '../inventory/inventory.service.js';
import { ProductVariant } from '../products/entities/product-variant.entity.js';
import { Order, OrderStatus } from './entities/order.entity.js';
import { OrderItem } from '../order-items/entities/order-item.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import {
    Payment,
    PaymentStatus,
} from '../payments/entities/payment.entity.js';

@Injectable()
export class OrdersService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly inventoryService: InventoryService,
    ) { }

    /**
     * Crea una orden pendiente y reserva el inventario
     * dentro de una transacción.
     */
    async createOrder(
        userId: string,
        dto: CreateOrderDto,
    ): Promise<Order> {
        return this.dataSource.transaction(async (manager) => {
            const orderRepository = manager.getRepository(Order);
            const itemRepository = manager.getRepository(OrderItem);
            const variantRepository =
                manager.getRepository(ProductVariant);

            // Combinamos variantes repetidas para evitar duplicados.
            const quantities = new Map<string, number>();

            for (const item of dto.items) {
                const current =
                    quantities.get(item.productVariantId) ?? 0;

                const next = current + item.quantity;

                if (!Number.isSafeInteger(next) || next > 1_000_000_000) {
                    throw new ConflictException(
                        'La cantidad solicitada supera el límite permitido.',
                    );
                }

                quantities.set(item.productVariantId, next);
            }

            // Todas las operaciones bloquean variantes en el mismo orden.
            const requestedItems = [...quantities.entries()]
                .map(([productVariantId, quantity]) => ({
                    productVariantId,
                    quantity,
                }))
                .sort((a, b) =>
                    a.productVariantId.localeCompare(b.productVariantId),
                );

            let subtotal = new Decimal(0);

            const orderItemsData: Array<{
                productVariant: ProductVariant;
                productVariantId: string;
                productName: string;
                sku: string;
                quantity: number;
                unitPrice: string;
                unitCost: string;
                subtotal: string;
            }> = [];

            for (const item of requestedItems) {
                const variant = await variantRepository
                    .createQueryBuilder('variant')
                    .leftJoinAndSelect('variant.product', 'product')
                    .setLock('pessimistic_write')
                    .where('variant.id = :id', {
                        id: item.productVariantId,
                    })
                    .andWhere('variant.is_active = true')
                    .andWhere('product.is_active = true')
                    .getOne();

                if (!variant) {
                    throw new NotFoundException(
                        `La variante ${item.productVariantId} no existe o está inactiva.`,
                    );
                }

                const availableStock =
                    variant.stock - variant.reservedStock;

                if (availableStock < item.quantity) {
                    throw new ConflictException(
                        `Stock insuficiente para ${variant.product.name}. ` +
                        `Disponible: ${availableStock}. ` +
                        `Solicitado: ${item.quantity}.`,
                    );
                }

                const unitPrice = new Decimal(
                    variant.price ?? variant.product.basePrice,
                );

                const unitCost = new Decimal(variant.cost);

                const itemSubtotal = unitPrice.mul(item.quantity);

                subtotal = subtotal.plus(itemSubtotal);

                orderItemsData.push({
                    productVariant: variant,
                    productVariantId: variant.id,
                    productName: variant.product.name,
                    sku: variant.sku,
                    quantity: item.quantity,
                    unitPrice: unitPrice.toFixed(2),
                    unitCost: unitCost.toFixed(2),
                    subtotal: itemSubtotal.toFixed(2),
                });
            }

            const discount = new Decimal(0);
            const shippingCost = new Decimal(0);

            const total = subtotal
                .minus(discount)
                .plus(shippingCost);

            const order = orderRepository.create({
                userId,
                status: OrderStatus.PENDING,
                subtotal: subtotal.toFixed(2),
                discount: discount.toFixed(2),
                shippingCost: shippingCost.toFixed(2),
                total: total.toFixed(2),

                shippingRecipientName:
                    dto.shippingRecipientName.trim(),
                shippingPhone: dto.shippingPhone.trim(),
                shippingProvince: dto.shippingProvince.trim(),
                shippingCity: dto.shippingCity.trim(),
                shippingParish: dto.shippingParish?.trim() || null,
                shippingStreet: dto.shippingStreet.trim(),
                shippingReference:
                    dto.shippingReference?.trim() || null,
                shippingPostalCode:
                    dto.shippingPostalCode?.trim() || null,
            });

            const savedOrder = await orderRepository.save(order);

            for (const item of orderItemsData) {
                this.inventoryService.reserveLockedVariant(
                    item.productVariant,
                    item.quantity,
                );

                await variantRepository.save(item.productVariant);

                const orderItem = itemRepository.create({
                    orderId: savedOrder.id,
                    productVariantId: item.productVariantId,
                    productName: item.productName,
                    sku: item.sku,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    unitCost: item.unitCost,
                    subtotal: item.subtotal,
                });

                await itemRepository.save(orderItem);
            }

            return this.getOrderWithItems(manager, savedOrder.id);
        });
    }

    /**
     * Cancela una orden pendiente del cliente autenticado.
     *
     * La orden, sus pagos pendientes y las reservas se
     * actualizan en una sola transacción.
     */
    async cancelOrder(
        orderId: string,
        userId: string,
    ): Promise<Order> {
        return this.dataSource.transaction(async (manager) => {
            const orderRepository = manager.getRepository(Order);
            const itemRepository = manager.getRepository(OrderItem);
            const paymentRepository = manager.getRepository(Payment);

            // Bloqueamos primero la orden para serializar operaciones
            // concurrentes sobre el mismo pedido.
            const order = await orderRepository
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
                    'La orden ya está cancelada.',
                );
            }

            if (order.status !== OrderStatus.PENDING) {
                throw new ConflictException(
                    'Solo se pueden cancelar órdenes pendientes. ' +
                    'Las órdenes confirmadas requieren un proceso de devolución.',
                );
            }

            const items = await itemRepository.find({
                where: { orderId: order.id },
            });

            if (items.length === 0) {
                throw new ConflictException(
                    'La orden no contiene productos y no puede liberar reservas automáticamente.',
                );
            }

            // Mantener el orden de locks consistente evita muchos
            // deadlocks cuando varias órdenes comparten variantes.
            items.sort((a, b) =>
                a.productVariantId.localeCompare(b.productVariantId),
            );

            // Verificamos que exista suficiente reserva antes de
            // empezar a modificar el inventario.
            for (const item of items) {
                const variant = await manager
                    .getRepository(ProductVariant)
                    .createQueryBuilder('variant')
                    .setLock('pessimistic_write')
                    .where('variant.id = :id', {
                        id: item.productVariantId,
                    })
                    .getOne();

                if (!variant) {
                    throw new ConflictException(
                        'No se encontró una variante necesaria para liberar el inventario.',
                    );
                }

                if (variant.reservedStock < item.quantity) {
                    throw new ConflictException(
                        `La reserva de inventario de la variante ${variant.id} ` +
                        'no coincide con la cantidad de la orden.',
                    );
                }
            }

            // Liberamos las reservas. El stock físico no cambia.
            for (const item of items) {
                await this.inventoryService.releaseReservedStock(
                    manager,
                    item.productVariantId,
                    item.quantity,
                );
            }

            // Una orden cancelada no debe conservar pagos pendientes.
            const pendingPayments = await paymentRepository.find({
                where: {
                    orderId: order.id,
                    status: PaymentStatus.PENDING,
                },
            });

            for (const payment of pendingPayments) {
                payment.status = PaymentStatus.FAILED;
                payment.notes = [
                    payment.notes?.trim(),
                    'Pago marcado como fallido porque el cliente canceló la orden.',
                ]
                    .filter(Boolean)
                    .join(' ');

                await paymentRepository.save(payment);
            }

            order.status = OrderStatus.CANCELLED;

            await orderRepository.save(order);

            return this.getOrderWithItems(manager, order.id);
        });
    }

    /**
     * Recupera una orden con sus productos dentro
     * de la transacción actual.
     */
    private async getOrderWithItems(
        manager: EntityManager,
        orderId: string,
    ): Promise<Order> {
        const order = await manager
            .getRepository(Order)
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .where('order.id = :orderId', { orderId })
            .getOne();

        if (!order) {
            throw new NotFoundException(
                'No se encontró la orden.',
            );
        }

        return order;
    }
}
