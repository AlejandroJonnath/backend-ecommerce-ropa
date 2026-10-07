import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { DataSource, EntityManager } from 'typeorm';

import { ProductVariant } from '../products/entities/product-variant.entity.js';

import {
    InventoryMovement,
    InventoryMovementType,
} from './entities/inventory-movement.entity.js';

import { QueryInventoryMovementsDto } from './dto/query-inventory-movements.dto.js';

@Injectable()
export class InventoryService {
    constructor(private readonly dataSource: DataSource) { }

    /**
     * Registra una compra de inventario.
     *
     * Este método público abre su propia transacción.
     * Se utiliza desde los endpoints administrativos.
     */
    async createPurchase(
        productVariantId: string,
        quantity: number,
        userId: string,
        referenceId: string | null = null,
        reason: string | null = null,
    ): Promise<InventoryMovement> {
        return this.dataSource.transaction(async (manager) => {
            return this.registerPurchase(
                manager,
                productVariantId,
                quantity,
                userId,
                referenceId,
                reason,
            );
        });
    }

    /**
     * Registra una devolución.
     */
    async createReturn(
        productVariantId: string,
        quantity: number,
        userId: string,
        referenceId: string | null = null,
        reason: string | null = null,
    ): Promise<InventoryMovement> {
        return this.dataSource.transaction(async (manager) => {
            return this.registerReturn(
                manager,
                productVariantId,
                quantity,
                userId,
                referenceId,
                reason,
            );
        });
    }

    /**
     * Registra productos dañados.
     */
    async createDamage(
        productVariantId: string,
        quantity: number,
        userId: string,
        referenceId: string | null = null,
        reason: string | null = null,
    ): Promise<InventoryMovement> {
        return this.dataSource.transaction(async (manager) => {
            return this.registerDamage(
                manager,
                productVariantId,
                quantity,
                userId,
                referenceId,
                reason,
            );
        });
    }

    /**
     * Realiza un ajuste manual de inventario.
     *
     * quantity > 0:
     * aumenta stock.
     *
     * quantity < 0:
     * disminuye stock.
     */
    async createAdjustment(
        productVariantId: string,
        quantity: number,
        userId: string,
        referenceId: string | null = null,
        reason: string | null = null,
    ): Promise<InventoryMovement> {
        return this.dataSource.transaction(async (manager) => {
            return this.registerAdjustment(
                manager,
                productVariantId,
                quantity,
                userId,
                referenceId,
                reason,
            );
        });
    }

    /**
     * Consulta el estado actual del inventario de una variante.
     */
    async getVariantInventory(productVariantId: string) {
        const variant = await this.dataSource
            .getRepository(ProductVariant)
            .createQueryBuilder('variant')
            .leftJoinAndSelect('variant.product', 'product')
            .leftJoinAndSelect('variant.size', 'size')
            .leftJoinAndSelect('variant.color', 'color')
            .where('variant.id = :id', {
                id: productVariantId,
            })
            .getOne();

        if (!variant) {
            throw new NotFoundException(
                'La variante del producto no existe.',
            );
        }

        return {
            variantId: variant.id,
            product: {
                id: variant.product.id,
                name: variant.product.name,
                slug: variant.product.slug,
                isActive: variant.product.isActive,
            },
            sku: variant.sku,
            size: {
                id: variant.size.id,
                name: variant.size.name,
            },
            color: {
                id: variant.color.id,
                name: variant.color.name,
            },
            stock: variant.stock,
            reservedStock: variant.reservedStock,
            availableStock: variant.stock - variant.reservedStock,
            isActive: variant.isActive,
        };
    }

    /**
     * Consulta el historial de movimientos de una variante.
     */
    async getMovements(
        productVariantId: string,
        query: QueryInventoryMovementsDto,
    ) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        const variantExists = await this.dataSource
            .getRepository(ProductVariant)
            .exists({
                where: {
                    id: productVariantId,
                },
            });

        if (!variantExists) {
            throw new NotFoundException(
                'La variante del producto no existe.',
            );
        }

        const queryBuilder = this.dataSource
            .getRepository(InventoryMovement)
            .createQueryBuilder('movement')
            .leftJoinAndSelect('movement.user', 'user')
            .where('movement.product_variant_id = :productVariantId', {
                productVariantId,
            });

        if (query.type) {
            queryBuilder.andWhere('movement.type = :type', {
                type: query.type,
            });
        }

        queryBuilder
            .orderBy('movement.created_at', 'DESC')
            .addOrderBy('movement.id', 'DESC')
            .skip(skip)
            .take(limit);

        const [movements, total] =
            await queryBuilder.getManyAndCount();

        return {
            data: movements,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage:
                    page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    /**
     * Reserva stock para una orden.
     *
     * Este método NO genera un movimiento de inventario,
     * porque todavía no existe una salida física.
     */
    async reserveStock(
        manager: EntityManager,
        productVariantId: string,
        quantity: number,
    ): Promise<void> {
        this.validateQuantity(quantity);

        const variant = await this.getLockedVariant(
            manager,
            productVariantId,
        );

        this.reserveLockedVariant(
            variant,
            quantity,
        );

        await manager
            .getRepository(ProductVariant)
            .save(variant);
    }

    /**
     * Libera una reserva.
     *
     * Tampoco genera movimiento físico.
     */
    async releaseReservedStock(
        manager: EntityManager,
        productVariantId: string,
        quantity: number,
    ): Promise<void> {
        this.validateQuantity(quantity);

        const variant = await this.getLockedVariant(
            manager,
            productVariantId,
        );

        if (variant.reservedStock < quantity) {
            throw new BadRequestException(
                `La reserva solicitada supera el stock reservado. ` +
                `Reservado: ${variant.reservedStock}. ` +
                `Solicitado: ${quantity}.`,
            );
        }

        variant.reservedStock -= quantity;

        await manager
            .getRepository(ProductVariant)
            .save(variant);
    }

    /**
     * Confirma una reserva como venta.
     *
     * Este método reduce el stock físico y crea
     * el movimiento SALE.
     */
    async confirmReservedStock(
        manager: EntityManager,
        productVariantId: string,
        quantity: number,
        userId: string | null = null,
        referenceId: string | null = null,
        reason: string | null = null,
    ): Promise<InventoryMovement> {
        this.validateQuantity(quantity);

        const variant = await this.getLockedVariant(
            manager,
            productVariantId,
        );

        if (variant.reservedStock < quantity) {
            throw new BadRequestException(
                `La reserva no es suficiente. ` +
                `Reservado: ${variant.reservedStock}. ` +
                `Solicitado: ${quantity}.`,
            );
        }

        if (variant.stock < quantity) {
            throw new BadRequestException(
                'El stock físico no permite confirmar esta reserva.',
            );
        }

        const stockBefore = variant.stock;
        const stockAfter = stockBefore - quantity;

        variant.stock = stockAfter;
        variant.reservedStock -= quantity;

        await manager
            .getRepository(ProductVariant)
            .save(variant);

        const movement = manager
            .getRepository(InventoryMovement)
            .create({
                productVariantId,
                type: InventoryMovementType.SALE,
                quantity: -quantity,
                stockBefore,
                stockAfter,
                userId,
                referenceId,
                reason,
            });

        return manager
            .getRepository(InventoryMovement)
            .save(movement);
    }

    /**
     * Registra una compra.
     */
    async registerPurchase(
        manager: EntityManager,
        productVariantId: string,
        quantity: number,
        userId: string | null = null,
        referenceId: string | null = null,
        reason: string | null = null,
    ): Promise<InventoryMovement> {
        this.validateQuantity(quantity);

        const variant = await this.getLockedVariant(
            manager,
            productVariantId,
        );

        const stockBefore = variant.stock;
        const stockAfter = stockBefore + quantity;

        this.validateStockLimit(stockAfter);

        variant.stock = stockAfter;

        await manager
            .getRepository(ProductVariant)
            .save(variant);

        const movement = manager
            .getRepository(InventoryMovement)
            .create({
                productVariantId,
                type: InventoryMovementType.PURCHASE,
                quantity,
                stockBefore,
                stockAfter,
                userId,
                referenceId,
                reason,
            });

        return manager
            .getRepository(InventoryMovement)
            .save(movement);
    }

    /**
     * Registra una devolución.
     */
    async registerReturn(
        manager: EntityManager,
        productVariantId: string,
        quantity: number,
        userId: string | null = null,
        referenceId: string | null = null,
        reason: string | null = null,
    ): Promise<InventoryMovement> {
        this.validateQuantity(quantity);

        const variant = await this.getLockedVariant(
            manager,
            productVariantId,
        );

        const stockBefore = variant.stock;
        const stockAfter = stockBefore + quantity;

        this.validateStockLimit(stockAfter);

        variant.stock = stockAfter;

        await manager
            .getRepository(ProductVariant)
            .save(variant);

        const movement = manager
            .getRepository(InventoryMovement)
            .create({
                productVariantId,
                type: InventoryMovementType.RETURN,
                quantity,
                stockBefore,
                stockAfter,
                userId,
                referenceId,
                reason,
            });

        return manager
            .getRepository(InventoryMovement)
            .save(movement);
    }

    /**
     * Registra productos dañados.
     */
    async registerDamage(
        manager: EntityManager,
        productVariantId: string,
        quantity: number,
        userId: string | null = null,
        referenceId: string | null = null,
        reason: string | null = null,
    ): Promise<InventoryMovement> {
        this.validateQuantity(quantity);

        const variant = await this.getLockedVariant(
            manager,
            productVariantId,
        );

        const availableStock =
            variant.stock - variant.reservedStock;

        if (availableStock < quantity) {
            throw new BadRequestException(
                `No se puede registrar el daño. ` +
                `Stock disponible: ${availableStock}.`,
            );
        }

        const stockBefore = variant.stock;
        const stockAfter = stockBefore - quantity;

        variant.stock = stockAfter;

        await manager
            .getRepository(ProductVariant)
            .save(variant);

        const movement = manager
            .getRepository(InventoryMovement)
            .create({
                productVariantId,
                type: InventoryMovementType.DAMAGE,
                quantity: -quantity,
                stockBefore,
                stockAfter,
                userId,
                referenceId,
                reason,
            });

        return manager
            .getRepository(InventoryMovement)
            .save(movement);
    }

    /**
     * Registra un ajuste manual.
     */
    async registerAdjustment(
        manager: EntityManager,
        productVariantId: string,
        quantity: number,
        userId: string | null = null,
        referenceId: string | null = null,
        reason: string | null = null,
    ): Promise<InventoryMovement> {
        if (!Number.isInteger(quantity)) {
            throw new BadRequestException(
                'La cantidad del ajuste debe ser un número entero.',
            );
        }

        if (quantity === 0) {
            throw new BadRequestException(
                'La cantidad del ajuste no puede ser 0.',
            );
        }

        if (Math.abs(quantity) > 1_000_000_000) {
            throw new BadRequestException(
                'La cantidad del ajuste supera el límite permitido.',
            );
        }

        if (!reason?.trim()) {
            throw new BadRequestException(
                'El motivo del ajuste es obligatorio.',
            );
        }

        const variant = await this.getLockedVariant(
            manager,
            productVariantId,
        );

        const stockBefore = variant.stock;
        const stockAfter = stockBefore + quantity;

        this.validateStockLimit(stockAfter);

        if (quantity < 0) {
            const availableStock =
                variant.stock - variant.reservedStock;

            const decrease = Math.abs(quantity);

            if (availableStock < decrease) {
                throw new BadRequestException(
                    `No se puede reducir el inventario por debajo del ` +
                    `stock reservado. Stock disponible: ${availableStock}.`,
                );
            }
        }

        variant.stock = stockAfter;

        await manager
            .getRepository(ProductVariant)
            .save(variant);

        const movement = manager
            .getRepository(InventoryMovement)
            .create({
                productVariantId,
                type: InventoryMovementType.ADJUSTMENT,
                quantity,
                stockBefore,
                stockAfter,
                userId,
                referenceId,
                reason: reason.trim(),
            });

        return manager
            .getRepository(InventoryMovement)
            .save(movement);
    }

    /**
     * Reserva stock sobre una variante que ya está bloqueada
     * dentro de una transacción.
     *
     * Se utiliza principalmente desde OrdersService.
     */
    reserveLockedVariant(
        variant: ProductVariant,
        quantity: number,
    ): void {
        this.validateQuantity(quantity);

        const availableStock =
            variant.stock - variant.reservedStock;

        if (availableStock < quantity) {
            throw new BadRequestException(
                `Stock insuficiente. ` +
                `Disponible: ${availableStock}. ` +
                `Solicitado: ${quantity}.`,
            );
        }

        variant.reservedStock += quantity;
    }

    /**
     * Obtiene y bloquea una variante para evitar
     * condiciones de carrera durante operaciones de inventario.
     */
    private async getLockedVariant(
        manager: EntityManager,
        productVariantId: string,
    ): Promise<ProductVariant> {
        const variant = await manager
            .getRepository(ProductVariant)
            .createQueryBuilder('variant')
            .setLock('pessimistic_write')
            .where('variant.id = :id', {
                id: productVariantId,
            })
            .andWhere('variant.is_active = true')
            .getOne();

        if (!variant) {
            throw new NotFoundException(
                'La variante del producto no existe o está inactiva.',
            );
        }

        return variant;
    }

    /**
     * Valida cantidades positivas.
     */
    private validateQuantity(
        quantity: number,
    ): void {
        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            throw new BadRequestException(
                'La cantidad debe ser un número entero mayor que 0.',
            );
        }

        if (quantity > 1_000_000_000) {
            throw new BadRequestException(
                'La cantidad supera el límite permitido.',
            );
        }
    }

    /**
     * Evita superar el máximo permitido por PostgreSQL integer.
     */
    private validateStockLimit(stock: number): void {
        if (stock > 2_147_483_647) {
            throw new BadRequestException(
                'El stock resultante supera el límite permitido.',
            );
        }

        if (stock < 0) {
            throw new BadRequestException(
                'El stock no puede ser negativo.',
            );
        }
    }
}