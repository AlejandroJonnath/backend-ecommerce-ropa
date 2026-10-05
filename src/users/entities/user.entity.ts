import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, type Relation, UpdateDateColumn, } from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity.js';
import { Address } from '../../addresses/entities/address.entity.js';
import { Order } from '../../orders/entities/order.entity.js';
import { InventoryMovement } from '../../inventory/entities/inventory-movement.entity.js';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    ADMIN = 'ADMIN',
}

@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'first_name', type: 'varchar', length: 100, })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 100, })
    lastName: string;

    @Column({ type: 'varchar', length: 150, unique: true, })
    email: string;

    @Column({ type: 'varchar', length: 255, select: false, })
    password: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER, })
    role: UserRole;

    @Column({ name: 'is_active', type: 'boolean', default: true, })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', })
    updatedAt: Date;

    @OneToMany(() => Address, (address) => address.user)
    addresses: Relation<Address>[];

    @OneToMany(() => Order, (order) => order.user)
    orders: Relation<Order>[];

    @OneToMany(() => InventoryMovement, (movement) => movement.user,)
    inventoryMovements: Relation<InventoryMovement>[];

    @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user,)
    refreshTokens: Relation<RefreshToken[]>;


}