import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    type Relation,
    UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity.js';

@Entity('categories')
export class Category {
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
        name: 'image_url',
        type: 'text',
        nullable: true,
    })
    imageUrl: string | null;

    @Column({
        name: 'is_active',
        type: 'boolean',
        default: true,
    })
    isActive: boolean;

    @OneToMany(() => Product, (product) => product.category)
    products: Relation<Product>[];

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