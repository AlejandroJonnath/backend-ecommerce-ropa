import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
} from 'typeorm';

import { Product } from './product.entity.js';

@Entity('product_images')
@Index('idx_product_images_product_id', ['productId'])
export class ProductImage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        name: 'product_id',
        type: 'uuid',
    })
    productId: string;

    @ManyToOne(() => Product, (product) => product.images, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'product_id',
    })
    product: Relation<Product>;

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