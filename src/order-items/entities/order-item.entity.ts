import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity.js';
import { ProductVariant } from '../../products/entities/product-variant.entity.js';

@Entity('order_items')
@Unique('uq_order_item_order_variant', ['orderId', 'productVariantId'])
@Index('idx_order_items_order_id', ['orderId'])
@Index('idx_order_items_product_variant_id', ['productVariantId'])
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'order_id',
        type: 'uuid',
    })
    orderId: string;

    @ManyToOne(() => Order, (order) => order.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'order_id',
    })
    order: Order;

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
    productVariant: ProductVariant;

    @Column({
        type: 'varchar',
        length: 150,
    })
    productName: string;

    @Column({
        type: 'varchar',
        length: 100,
    })
    sku: string;

    @Column({
        type: 'integer',
    })
    quantity: number;

    @Column({
        name: 'unit_price',
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    unitPrice: string;

    @Column({
        name: 'unit_cost',
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    unitCost: string;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    subtotal: string;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;
}