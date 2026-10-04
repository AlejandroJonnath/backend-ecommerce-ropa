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

import { ExpenseCategory } from '../../expense-categories/entities/expense-category.entity.js';

@Entity('expenses')
@Index('idx_expenses_category_id', ['categoryId'])
@Index('idx_expenses_expense_date', ['expenseDate'])
@Index('idx_expenses_created_at', ['createdAt'])
export class Expense {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'category_id',
        type: 'uuid',
    })
    categoryId: string;

    @ManyToOne(() => ExpenseCategory, (category) => category.expenses, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({
        name: 'category_id',
    })
    category: ExpenseCategory;

    @Column({
        type: 'varchar',
        length: 200,
    })
    description: string;

    @Column({
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    amount: string;

    @Column({
        name: 'expense_date',
        type: 'date',
    })
    expenseDate: string;

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