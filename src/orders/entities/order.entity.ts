import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';
import { OrderItem } from '../../order-items/entities/order-item.entity.js';
import { Payment } from '../../payments/entities/payment.entity.js';

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

@Entity('orders')
@Index('idx_orders_user_created_at', ['userId', 'createdAt'])
@Index('idx_orders_status', ['status'])
@Index('idx_orders_created_at', ['createdAt'])
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'user_id',
        type: 'uuid',
    })
    userId: string;

    @ManyToOne(() => User, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({
        name: 'user_id',
    })
    user: User;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    subtotal: string;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
    })
    discount: string;

    @Column({
        name: 'shipping_cost',
        type: 'numeric',
        precision: 12,
        scale: 2,
        default: 0,
    })
    shippingCost: string;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    total: string;

    @Column({
        name: 'shipping_recipient_name',
        type: 'varchar',
        length: 200,
    })
    shippingRecipientName: string;

    @Column({
        name: 'shipping_phone',
        type: 'varchar',
        length: 20,
    })
    shippingPhone: string;

    @Column({
        name: 'shipping_province',
        type: 'varchar',
        length: 100,
    })
    shippingProvince: string;

    @Column({
        name: 'shipping_city',
        type: 'varchar',
        length: 100,
    })
    shippingCity: string;

    @Column({
        name: 'shipping_parish',
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    shippingParish: string | null;

    @Column({
        name: 'shipping_street',
        type: 'varchar',
        length: 255,
    })
    shippingStreet: string;

    @Column({
        name: 'shipping_reference',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    shippingReference: string | null;

    @Column({
        name: 'shipping_postal_code',
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    shippingPostalCode: string | null;

    @OneToMany(() => OrderItem, (item) => item.order)
    items: OrderItem[];

    @OneToMany(() => Payment, (payment) => payment.order)
    payments: Payment[];

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
}