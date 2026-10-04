import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { InventoryService } from '../inventory/inventory.service.js';
import { Order, OrderStatus } from './entities/order.entity.js';
import { OrderItem } from '../order-items/entities/order-item.entity.js';
import { ProductVariant } from '../products/entities/product-variant.entity.js';
import {
    CreateOrderDto,
    CreateOrderItemDto,
} from './dto/create-order.dto.js';

@Injectable()
export class OrdersService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly inventoryService: InventoryService,
    ) { }

    async createOrder(
        userId: string,
        dto: CreateOrderDto,
    ): Promise<Order> {
        if (!dto.items?.length) {
            throw new BadRequestException(
                'El pedido debe contener al menos un producto.',
            );
        }

        const items = this.mergeDuplicateItems(dto.items);

        return this.dataSource.transaction(async (manager) => {
            const variantRepository =
                manager.getRepository(ProductVariant);

            const orderRepository =
                manager.getRepository(Order);

            const orderItemRepository =
                manager.getRepository(OrderItem);

            let subtotal = 0;

            const orderItemsData: Array<{
                productVariantId: string;
                productName: string;
                sku: string;
                quantity: number;
                unitPrice: string;
                unitCost: string;
                subtotal: string;
            }> = [];

            for (const item of items) {
                const variant = await variantRepository
                    .createQueryBuilder('variant')
                    .leftJoinAndSelect(
                        'variant.product',
                        'product',
                    )
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
                    throw new BadRequestException(
                        `Stock insuficiente para "${variant.product.name}". ` +
                        `Disponible: ${availableStock}. ` +
                        `Solicitado: ${item.quantity}.`,
                    );
                }

                const unitPrice = Number(
                    variant.price ?? variant.product.basePrice,
                );

                const unitCost = Number(variant.cost);

                const itemSubtotal =
                    unitPrice * item.quantity;

                subtotal += itemSubtotal;

                orderItemsData.push({
                    productVariantId: variant.id,
                    productName: variant.product.name,
                    sku: variant.sku,
                    quantity: item.quantity,
                    unitPrice: unitPrice.toFixed(2),
                    unitCost: unitCost.toFixed(2),
                    subtotal: itemSubtotal.toFixed(2),
                });
            }

            const discount = 0;
            const shippingCost = 0;

            const total =
                subtotal -
                discount +
                shippingCost;

            const order = orderRepository.create({
                userId,

                status: OrderStatus.PENDING,

                subtotal: subtotal.toFixed(2),
                discount: discount.toFixed(2),
                shippingCost: shippingCost.toFixed(2),
                total: total.toFixed(2),

                shippingRecipientName:
                    dto.shippingRecipientName,

                shippingPhone:
                    dto.shippingPhone,

                shippingProvince:
                    dto.shippingProvince,

                shippingCity:
                    dto.shippingCity,

                shippingParish:
                    dto.shippingParish ?? null,

                shippingStreet:
                    dto.shippingStreet,

                shippingReference:
                    dto.shippingReference ?? null,

                shippingPostalCode:
                    dto.shippingPostalCode ?? null,
            });

            const savedOrder =
                await orderRepository.save(order);

            for (const item of orderItemsData) {
                await this.inventoryService.reserveStock(
                    manager,
                    item.productVariantId,
                    item.quantity,
                );

                const orderItem =
                    orderItemRepository.create({
                        orderId: savedOrder.id,
                        productVariantId:
                            item.productVariantId,
                        productName:
                            item.productName,
                        sku:
                            item.sku,
                        quantity:
                            item.quantity,
                        unitPrice:
                            item.unitPrice,
                        unitCost:
                            item.unitCost,
                        subtotal:
                            item.subtotal,
                    });

                await orderItemRepository.save(
                    orderItem,
                );
            }

            return this.getOrderWithItems(
                manager,
                savedOrder.id,
            );
        });
    }

    /**
     * Une productos repetidos enviados por el cliente.
     *
     * Ejemplo:
     *
     * A x 2
     * A x 3
     *
     * se convierte en:
     *
     * A x 5
     */
    private mergeDuplicateItems(
        items: CreateOrderItemDto[],
    ): CreateOrderItemDto[] {
        const quantities = new Map<string, number>();

        for (const item of items) {
            const current =
                quantities.get(item.productVariantId) ?? 0;

            quantities.set(
                item.productVariantId,
                current + item.quantity,
            );
        }

        return Array.from(
            quantities.entries(),
        ).map(
            ([productVariantId, quantity]) => ({
                productVariantId,
                quantity,
            }),
        );
    }

    private async getOrderWithItems(
        manager: EntityManager,
        orderId: string,
    ): Promise<Order> {
        const order =
            await manager
                .getRepository(Order)
                .findOne({
                    where: {
                        id: orderId,
                    },
                    relations: {
                        items: true,
                    },
                });

        if (!order) {
            throw new NotFoundException(
                'El pedido no pudo ser encontrado.',
            );
        }

        return order;
    }
}