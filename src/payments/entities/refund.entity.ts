
import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Payment } from './payment.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum RefundStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Entity('refunds')
@Check('chk_refunds_amount_positive', 'amount > 0')
@Index('idx_refunds_payment_created_at', ['paymentId', 'createdAt'])
@Index('idx_refunds_status', ['status'])
export class Refund {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'payment_id', type: 'uuid' })
    paymentId: string;

    @ManyToOne(() => Payment, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'payment_id' })
    payment: Payment;

    @Column({ type: 'numeric', precision: 12, scale: 2 })
    amount: string;

    @Column({
        type: 'enum',
        enum: RefundStatus,
        default: RefundStatus.PENDING,
    })
    status: RefundStatus;

    @Column({
        name: 'external_reference',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    externalReference: string | null;

    @Column({ type: 'text', nullable: true })
    reason: string | null;

    @Column({ name: 'created_by', type: 'uuid', nullable: true })
    createdBy: string | null;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'created_by' })
    creator: User | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
