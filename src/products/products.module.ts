import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity.js';
import { ProductImage } from './entities/product-image.entity.js';
import { ProductVariant } from './entities/product-variant.entity.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            ProductImage,
            ProductVariant,
        ]),
    ],
})
export class ProductsModule { }