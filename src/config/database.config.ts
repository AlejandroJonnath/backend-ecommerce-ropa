import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',

  host: configService.get<string>('DB_HOST', 'localhost'),
  port: Number(configService.get<number>('DB_PORT', 5432)),

  username: configService.get<string>('DB_USER'),
  password: String(configService.get<string>('DB_PASSWORD') ?? ''),
  database: configService.get<string>('DB_NAME'),

  autoLoadEntities: true,

  synchronize: false, // permite que modifiquemos manualmente todo
});