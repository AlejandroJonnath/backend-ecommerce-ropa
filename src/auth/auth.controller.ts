import { Body, Controller, Post, } from '@nestjs/common';
import { AuthService, } from './auth.service.js';
import { LoginDto, } from './dto/login.dto.js';
import { RegisterDto, } from './dto/register.dto.js';
import { RefreshTokenDto, } from './dto/refresh-token.dto.js';
import { LogoutDto, } from './dto/logout.dto.js';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService,) {

    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto,) {

        return this.authService.register(registerDto,);

    }

    @Post('login')
    async login(@Body() loginDto: LoginDto,) {

        return this.authService.login(loginDto,);

    }

    @Post('refresh')
    async refresh(@Body() dto: RefreshTokenDto,) {

        return this.authService.refresh(dto,);

    }

    @Post('logout')
    async logout(@Body() dto: LogoutDto,) {

        await this.authService.logout(dto,);

        return {
            message: 'Sesión cerrada correctamente.',
        };
    }
}