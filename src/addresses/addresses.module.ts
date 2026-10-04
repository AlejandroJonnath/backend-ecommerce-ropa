import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Address } from './entities/address.entity.js';

@Module({
    imports: [TypeOrmModule.forFeature([Address])],
})
export class AddressesModule { }