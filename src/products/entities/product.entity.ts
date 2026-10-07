import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity.js';
import type { ProductImage } from './product-image.entity.js';
import type { ProductVariant } from './product-variant.entity.js';

/**
 * Shared lazy-reference registry.
 * Child entities (ProductImage, ProductVariant) populate this object
 * at the bottom of their own module, AFTER their class is defined.
 * By the time TypeORM calls the @OneToMany callbacks (during
 * DataSource.initialize), all modules are already loaded and these
 * references point to the real class constructors — same ESM instance,
 * no circular-init issues, no CJS/ESM mismatch.
 */
export const _productRelations: {
    ProductImage: new (...args: any[]) => ProductImage;
    ProductVariant: new (...args: any[]) => ProductVariant;
} = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ProductImage: null as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ProductVariant: null as any,
};

@Entity('products')
@Check(
    'chk_product_base_price',
    'base_price >= 0',
)
@Index(
    'idx_products_category_active',
    ['categoryId', 'isActive'],
)
@Index(
    'idx_products_active_created_at',
    ['isActive', 'createdAt'],
)
@Index(
    'idx_products_active_name',
    ['isActive', 'name'],
)
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'category_id',
        type: 'uuid',
    })
    categoryId: string;

    @ManyToOne(
        () => Category,
        (category) => category.products,
        {
            onDelete: 'RESTRICT',
        },
    )
    @JoinColumn({
        name: 'category_id',
    })
    category: Category;

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

    @OneToMany(
        () => _productRelations.ProductImage,
        (image) => image.product,
        {
            cascade: true,
        },
    )
    images: Relation<ProductImage>[];

    @OneToMany(
        () => _productRelations.ProductVariant,
        (variant) => variant.product,
    )
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