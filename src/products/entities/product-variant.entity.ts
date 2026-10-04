import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    type Relation,
    Unique,
    UpdateDateColumn,
} from 'typeorm';

import { Color } from '../../colors/entities/color.entity.js';
import { Size } from '../../sizes/entities/size.entity.js';
import { OrderItem } from '../../order-items/entities/order-item.entity.js';
import { InventoryMovement } from '../../inventory/entities/inventory-movement.entity.js';
import { Product } from './product.entity.js';

@Check('chk_product_variant_stock', 'stock >= 0')
@Check('chk_product_variant_reserved_stock', 'reserved_stock >= 0')
@Check(
    'chk_product_variant_reserved_not_greater_stock',
    'reserved_stock <= stock',
)
@Entity('product_variants')
@Unique('uq_product_variant_combination', [
    'productId',
    'sizeId',
    'colorId',
])
@Unique('uq_product_variant_sku', ['sku'])
@Index('idx_product_variants_product_active', ['productId', 'isActive'])
@Index('idx_product_variants_size_id', ['sizeId'])
@Index('idx_product_variants_color_id', ['colorId'])
export class ProductVariant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'product_id',
        type: 'uuid',
    })
    productId: string;

    @ManyToOne(() => Product, (product) => product.variants, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({
        name: 'product_id',
    })
    product: Relation<Product>;

    @Column({
        name: 'size_id',
        type: 'uuid',
    })
    sizeId: string;

    @ManyToOne(() => Size, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({
        name: 'size_id',
    })
    size: Relation<Size>;

    @Column({
        name: 'color_id',
        type: 'uuid',
    })
    colorId: string;

    @ManyToOne(() => Color, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({
        name: 'color_id',
    })
    color: Relation<Color>;

    @Column({
        type: 'varchar',
        length: 100,
    })
    sku: string;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
        nullable: true,
    })
    price: string | null;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    cost: string;

    @Column({
        type: 'integer',
        default: 0,
    })
    stock: number;

    @Column({
        name: 'is_active',
        type: 'boolean',
        default: true,
    })
    isActive: boolean;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamptz',
    })
    updatedAt: Date;

    @OneToMany(() => OrderItem, (orderItem) => orderItem.productVariant)
    orderItems: Relation<OrderItem>[];

    @OneToMany(
        () => InventoryMovement,
        (movement) => movement.productVariant,
    )
    inventoryMovements: Relation<InventoryMovement>[];

    @Column({
        name: 'reserved_stock',
        type: 'integer',
        default: 0,
    })
    reservedStock: number;
}