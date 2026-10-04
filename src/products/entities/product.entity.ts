import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    type Relation,
    UpdateDateColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity.js';
import { ProductImage } from './product-image.entity.js';
import { ProductVariant } from './product-variant.entity.js';

@Entity('products')
@Index('idx_products_category_id', ['categoryId'])
@Index('idx_products_is_active', ['isActive'])
@Index('idx_products_created_at', ['createdAt'])
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'category_id',
        type: 'uuid',
    })
    categoryId: string;

    @ManyToOne(() => Category, (category) => category.products, {
        onDelete: 'RESTRICT',
    })
    @JoinColumn({
        name: 'category_id',
    })
    category: Relation<Category>;

    @Column({
        type: 'varchar',
        length: 150,
    })
    name: string;

    @Column({
        type: 'varchar',
        length: 170,
        unique: true,
    })
    slug: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    description: string | null;

    @Column({
        name: 'base_price',
        type: 'numeric',
        precision: 12,
        scale: 2,
    })
    basePrice: string;

    @Column({
        name: 'is_active',
        type: 'boolean',
        default: true,
    })
    isActive: boolean;

    @OneToMany(() => ProductImage, (image) => image.product, {
        cascade: true,
    })
    images: Relation<ProductImage>[];

    @OneToMany(() => ProductVariant, (variant) => variant.product)
    variants: Relation<ProductVariant>[];

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