import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
} from 'typeorm';

import { ProductVariant } from '../../products/entities/product-variant.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum InventoryMovementType {
    PURCHASE = 'PURCHASE',
    SALE = 'SALE',
    RETURN = 'RETURN',
    DAMAGE = 'DAMAGE',
    ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('inventory_movements')
@Index('idx_inventory_movements_variant_date', [
    'productVariantId',
    'createdAt',
])
@Index('idx_inventory_movements_type', ['type'])
@Index('idx_inventory_movements_created_at', ['createdAt'])
export class InventoryMovement {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'product_variant_id',
        type: 'uuid',
    })
    productVariantId: string;

    @ManyToOne(() => ProductVariant, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({
        name: 'product_variant_id',
    })
    productVariant: Relation<ProductVariant>;

    @Column({
        type: 'enum',
        enum: InventoryMovementType,
    })
    type: InventoryMovementType;

    @Column({
        type: 'integer',
    })
    quantity: number;

    @Column({
        name: 'stock_before',
        type: 'integer',
    })
    stockBefore: number;

    @Column({
        name: 'stock_after',
        type: 'integer',
    })
    stockAfter: number;

    @Column({
        name: 'user_id',
        type: 'uuid',
        nullable: true,
    })
    userId: string | null;

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
        nullable: true,
    })
    @JoinColumn({
        name: 'user_id',
    })
    user: Relation<User> | null;

    @Column({
        type: 'text',
        nullable: true,
    })
    reason: string | null;

    @Column({
        name: 'reference_id',
        type: 'uuid',
        nullable: true,
    })
    referenceId: string | null;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;
}