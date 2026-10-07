import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { _productRelations, Product } from './product.entity.js';

@Entity('product_images')
@Index(
    'idx_product_images_product_position',
    ['productId', 'position'],
)
export class ProductImage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'product_id',
        type: 'uuid',
    })
    productId: string;

    @ManyToOne(
        () => Product,
        (product) => product.images,
        {
            onDelete: 'CASCADE',
        },
    )
    @JoinColumn({
        name: 'product_id',
    })
    product: Product;

    @Column({
        name: 'image_url',
        type: 'text',
    })
    imageUrl: string;

    @Column({
        type: 'integer',
        default: 0,
    })
    position: number;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamptz',
    })
    createdAt: Date;
}

// Self-register in the parent's lazy-reference registry.
// product.entity.ts uses `import type` for this module (no value import),
// so there is no circular initialization. By the time TypeORM calls the
// @OneToMany callback, this line has already run and the ref is set.
_productRelations.ProductImage = ProductImage;