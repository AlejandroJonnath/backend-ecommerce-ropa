import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity.js';

export enum PaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    CARD = 'CARD',
    OTHER = 'OTHER',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

@Entity('payments')
@Index('idx_payments_order_id', ['orderId'])
@Index('idx_payments_status', ['status'])
@Index('idx_payments_created_at', ['createdAt'])
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'order_id',
        type: 'uuid',
    })
    orderId: string;

    @ManyToOne(() => Order, (order) => order.payments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'order_id',
    })
    order: Order;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
    })
    method: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    amount: string;

    @Column({
        name: 'transaction_reference',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    transactionReference: string | null;

    @Column({
        type: 'text',
        nullable: true,
    })
    notes: string | null;

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