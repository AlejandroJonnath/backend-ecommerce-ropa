import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { EntityManager } from 'typeorm';

import { ProductVariant } from '../products/entities/product-variant.entity.js';

import {
    InventoryMovement,
    InventoryMovementType,
} from './entities/inventory-movement.entity.js';

@Injectable()
export class InventoryService {
    /**
     * Reserva stock utilizando un bloqueo pesimista
     * dentro de la transacción proporcionada.
     *
     * Esta función es útil cuando la reserva
     * se realiza como una operación independiente.
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
     * Libera stock que había sido reservado previamente.
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
     * Confirma una reserva y la convierte en una venta.
     *
     * Reduce el stock físico y también elimina
     * la cantidad previamente reservada.
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
     * Registra una compra de mercancía.
     *
     * Aumenta el stock físico.
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
     * Registra una devolución de mercancía.
     *
     * Aumenta el stock físico.
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
     * Registra mercancía dañada.
     *
     * El stock disponible se calcula como:
     *
     * stock físico - stock reservado
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
     * Reserva una cantidad sobre una variante
     * que YA fue bloqueada dentro de la transacción actual.
     *
     * Importante:
     * Este método NO vuelve a consultar ni bloquear
     * la variante en la base de datos.
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
     * Obtiene una variante utilizando un bloqueo
     * pesimista de escritura.
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
     * Valida cantidades de inventario.
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
    }
}