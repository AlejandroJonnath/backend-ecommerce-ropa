import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { Expense } from '../../expenses/entities/expense.entity.js';

@Entity('expense_categories')
export class ExpenseCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 100,
    })
    name: string;

    @Column({
        type: 'varchar',
        length: 120,
        unique: true,
    })
    slug: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    description: string | null;

    @Column({
        name: 'is_active',
        type: 'boolean',
        default: true,
    })
    isActive: boolean;

    @OneToMany(() => Expense, (expense) => expense.category)
    expenses: Expense[];

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