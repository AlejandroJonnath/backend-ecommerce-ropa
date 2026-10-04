import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Color } from './entities/color.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Color])],
})
export class ColorsModule { }