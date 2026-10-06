import {
    Body,
    Controller,
    Post,
} from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service.js';

import { LoginDto } from './dto/login.dto.js';

import { RegisterDto } from './dto/register.dto.js';

import { RefreshTokenDto } from './dto/refresh-token.dto.js';

import { LogoutDto } from './dto/logout.dto.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    /**
     * Registro de usuarios.
     *
     * Máximo:
     * 5 solicitudes por minuto.
     */
    @Post('register')
    @Throttle({
        default: {
            limit: 5,
            ttl: 60_000,
        },
    })
    async register(
        @Body()
        registerDto: RegisterDto,
    ) {
        return this.authService.register(
            registerDto,
        );
    }

    /**
     * Login.
     *
     * Máximo:
     * 5 intentos por minuto.
     *
     * Esto ayuda a reducir ataques
     * de fuerza bruta.
     */
    @Post('login')
    @Throttle({
        default: {
            limit: 5,
            ttl: 60_000,
        },
    })
    async login(
        @Body()
        loginDto: LoginDto,
    ) {
        return this.authService.login(
            loginDto,
        );
    }

    /**
     * Renovación del access token.
     */
    @Post('refresh')
    @Throttle({
        default: {
            limit: 10,
            ttl: 60_000,
        },
    })
    async refresh(
        @Body()
        dto: RefreshTokenDto,
    ) {
        return this.authService.refresh(
            dto,
        );
    }

    /**
     * Cierra una sesión revocando
     * el refresh token.
     */
    @Post('logout')
    @Throttle({
        default: {
            limit: 10,
            ttl: 60_000,
        },
    })
    async logout(
        @Body()
        dto: LogoutDto,
    ) {
        await this.authService.logout(
            dto,
        );

        return {
            message:
                'Sesión cerrada correctamente.',
        };
    }
}