import { Module, } from '@nestjs/common';
import { ConfigModule, ConfigService, } from '@nestjs/config';
import { JwtModule, } from '@nestjs/jwt';
import { PassportModule, } from '@nestjs/passport';
import { TypeOrmModule, } from '@nestjs/typeorm';
import { User, } from '../users/entities/user.entity.js';
import { RefreshToken, } from './entities/refresh-token.entity.js';
import { AuthController, } from './auth.controller.js';
import { AuthService, } from './auth.service.js';
import { JwtStrategy, } from './strategies/jwt.strategy.js';
import { RolesGuard, } from './guards/roles.guard.js';

@Module({

    imports: [

        TypeOrmModule.forFeature([User, RefreshToken,]),

        PassportModule,

        JwtModule.registerAsync({

            imports: [ConfigModule,],

            inject: [ConfigService,],

            useFactory: (configService: ConfigService,) => ({

                secret:
                    configService.getOrThrow<string>('JWT_SECRET',),

                signOptions: {

                    expiresIn:
                        configService.get<string>(
                            'JWT_EXPIRES_IN',
                            '15m',
                        ) as any,
                },
            }),
        }),
    ],

    controllers: [AuthController,],

    providers: [AuthService, JwtStrategy, RolesGuard,],

    exports: [AuthService, RolesGuard,],
})
export class AuthModule { }