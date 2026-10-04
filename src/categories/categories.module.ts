import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from './entities/category.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Category])],
})
export class CategoriesModule { }