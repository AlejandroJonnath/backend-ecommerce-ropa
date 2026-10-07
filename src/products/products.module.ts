import {
    Module,
} from '@nestjs/common';

import {
    TypeOrmModule,
} from '@nestjs/typeorm';

import {
    Category,
} from '../categories/entities/category.entity.js';

import {
    Color,
} from '../colors/entities/color.entity.js';

import {
    Size,
} from '../sizes/entities/size.entity.js';

import {
    Product,
} from './entities/product.entity.js';

import {
    ProductImage,
} from './entities/product-image.entity.js';

import {
    ProductVariant,
} from './entities/product-variant.entity.js';

import {
    ProductsController,
} from './products.controller.js';

import {
    ProductsService,
} from './products.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            ProductImage,
            ProductVariant,
            Category,
            Size,
            Color,
        ]),
    ],

    controllers: [
        ProductsController,
    ],

    providers: [
        ProductsService,
    ],

    exports: [
        ProductsService,
    ],
})
export class ProductsModule { }