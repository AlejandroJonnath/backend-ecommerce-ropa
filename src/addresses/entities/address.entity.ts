import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
    UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

@Entity('addresses')
export class Address {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'recipient_name',
        type: 'varchar',
        length: 200,
    })
    recipientName: string;

    @Column({
        type: 'varchar',
        length: 20,
    })
    phone: string;

    @Column({
        type: 'varchar',
        length: 100,
    })
    province: string;

    @Column({
        type: 'varchar',
        length: 100,
    })
    city: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    parish: string | null;

    @Column({
        type: 'varchar',
        length: 255,
    })
    street: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    reference: string | null;

    @Column({
        name: 'postal_code',
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    postalCode: string | null;

    @Column({
        name: 'is_default',
        type: 'boolean',
        default: false,
    })
    isDefault: boolean;

    @Column({
        name: 'user_id',
        type: 'uuid',
    })
    userId: string;

    @ManyToOne(() => User, (user) => user.addresses, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'user_id',
    })
    user: Relation<User>;

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