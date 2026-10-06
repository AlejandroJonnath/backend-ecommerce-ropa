import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { Decimal } from 'decimal.js';

import {
    DataSource,
    EntityManager,
} from 'typeorm';

import { InventoryService } from '../inventory/inventory.service.js';

import {
    Order,
    OrderStatus,
} from './entities/order.entity.js';

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

    /**
     * Crea un pedido completo dentro de una única
     * transacción de base de datos.
     *
     * Si cualquier operación falla:
     *
     * - no se crea el pedido;
     * - no se crean sus items;
     * - no se reserva stock.
     *
     * Todo se revierte automáticamente.
     */
    async createOrder(
        userId: string,
        dto: CreateOrderDto,
    ): Promise<Order> {
        if (!dto.items?.length) {
            throw new BadRequestException(
                'El pedido debe contener al menos un producto.',
            );
        }

        /**
         * Primero unificamos productos repetidos.
         *
         * Ejemplo:
         *
         * Variante A x 2
         * Variante A x 3
         *
         * Se convierte en:
         *
         * Variante A x 5
         */
        const items = this.mergeDuplicateItems(
            dto.items,
        ).sort((a, b) =>
            a.productVariantId.localeCompare(
                b.productVariantId,
            ),
        );

        return this.dataSource.transaction(
            async (manager) => {
                const variantRepository =
                    manager.getRepository(
                        ProductVariant,
                    );

                const orderRepository =
                    manager.getRepository(Order);

                const orderItemRepository =
                    manager.getRepository(OrderItem);

                /**
                 * Decimal evita los problemas de precisión
                 * de JavaScript con números decimales.
                 */
                let subtotal = new Decimal(0);

                /**
                 * Guardamos también la entidad ProductVariant
                 * que ya fue bloqueada.
                 *
                 * De esta manera no necesitamos volver a
                 * bloquearla posteriormente.
                 */
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

                /**
                 * Bloqueamos las variantes en un orden
                 * determinístico.
                 *
                 * Esto reduce el riesgo de deadlocks
                 * cuando existen múltiples pedidos simultáneos.
                 */
                for (const item of items) {
                    const variant =
                        await variantRepository
                            .createQueryBuilder('variant')
                            .leftJoinAndSelect(
                                'variant.product',
                                'product',
                            )
                            .setLock('pessimistic_write')
                            .where(
                                'variant.id = :id',
                                {
                                    id: item.productVariantId,
                                },
                            )
                            .andWhere(
                                'variant.is_active = true',
                            )
                            .andWhere(
                                'product.is_active = true',
                            )
                            .getOne();

                    if (!variant) {
                        throw new NotFoundException(
                            `La variante ${item.productVariantId} ` +
                            'no existe o está inactiva.',
                        );
                    }

                    /**
                     * Stock disponible =
                     *
                     * stock físico - stock reservado
                     */
                    const availableStock =
                        variant.stock -
                        variant.reservedStock;

                    if (
                        availableStock <
                        item.quantity
                    ) {
                        throw new BadRequestException(
                            `Stock insuficiente para "${variant.product.name}". ` +
                            `Disponible: ${availableStock}. ` +
                            `Solicitado: ${item.quantity}.`,
                        );
                    }

                    /**
                     * Precio de venta:
                     *
                     * Si la variante tiene precio propio,
                     * usamos ese.
                     *
                     * Si no, usamos el precio base del producto.
                     */
                    const unitPrice =
                        new Decimal(
                            variant.price ??
                            variant.product.basePrice,
                        );

                    /**
                     * Costo almacenado de la variante.
                     */
                    const unitCost =
                        new Decimal(
                            variant.cost,
                        );

                    /**
                     * Subtotal de este item.
                     */
                    const itemSubtotal =
                        unitPrice.mul(
                            item.quantity,
                        );

                    subtotal =
                        subtotal.plus(
                            itemSubtotal,
                        );

                    orderItemsData.push({
                        productVariant: variant,
                        productVariantId:
                            variant.id,
                        productName:
                            variant.product.name,
                        sku: variant.sku,
                        quantity: item.quantity,
                        unitPrice:
                            unitPrice.toFixed(2),
                        unitCost:
                            unitCost.toFixed(2),
                        subtotal:
                            itemSubtotal.toFixed(2),
                    });
                }

                /**
                 * Actualmente no manejamos descuentos
                 * ni costo de envío dinámico.
                 *
                 * Los dejamos preparados para futuras fases.
                 */
                const discount =
                    new Decimal(0);

                const shippingCost =
                    new Decimal(0);

                const total =
                    subtotal
                        .minus(discount)
                        .plus(shippingCost);

                /**
                 * Creamos el pedido.
                 */
                const order =
                    orderRepository.create({
                        userId,

                        status:
                            OrderStatus.PENDING,

                        subtotal:
                            subtotal.toFixed(2),

                        discount:
                            discount.toFixed(2),

                        shippingCost:
                            shippingCost.toFixed(2),

                        total:
                            total.toFixed(2),

                        shippingRecipientName:
                            dto.shippingRecipientName,

                        shippingPhone:
                            dto.shippingPhone,

                        shippingProvince:
                            dto.shippingProvince,

                        shippingCity:
                            dto.shippingCity,

                        shippingParish:
                            dto.shippingParish ??
                            null,

                        shippingStreet:
                            dto.shippingStreet,

                        shippingReference:
                            dto.shippingReference ??
                            null,

                        shippingPostalCode:
                            dto.shippingPostalCode ??
                            null,
                    });

                const savedOrder =
                    await orderRepository.save(
                        order,
                    );

                /**
                 * Ahora reservamos el stock.
                 *
                 * MUY IMPORTANTE:
                 *
                 * Las variantes ya fueron bloqueadas
                 * anteriormente.
                 *
                 * Por eso usamos reserveLockedVariant()
                 * en lugar de reserveStock().
                 *
                 * Así evitamos:
                 *
                 * 1. volver a consultar;
                 * 2. volver a bloquear;
                 * 3. hacer una consulta innecesaria.
                 */
                for (
                    const item of orderItemsData
                ) {
                    this.inventoryService.reserveLockedVariant(
                        item.productVariant,
                        item.quantity,
                    );

                    /**
                     * Guardamos la variante modificada
                     * dentro de la misma transacción.
                     */
                    await variantRepository.save(
                        item.productVariant,
                    );

                    /**
                     * Creamos el detalle del pedido.
                     */
                    const orderItem =
                        orderItemRepository.create({
                            orderId:
                                savedOrder.id,

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

                /**
                 * Devolvemos el pedido con sus items.
                 */
                return this.getOrderWithItems(
                    manager,
                    savedOrder.id,
                );
            },
        );
    }

    /**
     * Une productos repetidos enviados
     * por el cliente.
     */
    private mergeDuplicateItems(
        items: CreateOrderItemDto[],
    ): CreateOrderItemDto[] {
        const quantities =
            new Map<string, number>();

        for (const item of items) {
            const current =
                quantities.get(
                    item.productVariantId,
                ) ?? 0;

            quantities.set(
                item.productVariantId,
                current +
                item.quantity,
            );
        }

        return Array.from(
            quantities.entries(),
        ).map(
            ([
                productVariantId,
                quantity,
            ]) => ({
                productVariantId,
                quantity,
            }),
        );
    }

    /**
     * Obtiene un pedido junto con sus items.
     */
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