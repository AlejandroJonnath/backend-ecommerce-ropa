import { ConflictException, Injectable, UnauthorizedException, } from '@nestjs/common';
import { ConfigService, } from '@nestjs/config';
import { JwtService, } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, } from 'crypto';
import { InjectRepository, } from '@nestjs/typeorm';
import { Repository, } from 'typeorm';
import { User, UserRole, } from '../users/entities/user.entity.js';
import { RefreshToken, } from './entities/refresh-token.entity.js';
import { RegisterDto, } from './dto/register.dto.js';
import { LoginDto, } from './dto/login.dto.js';
import { RefreshTokenDto, } from './dto/refresh-token.dto.js';
import { LogoutDto, } from './dto/logout.dto.js';
import { JwtPayload, } from './types/jwt-payload.type.js';
import { RefreshTokenPayload, } from './types/refresh-token-payload.type.js';

@Injectable()
export class AuthService {

    constructor(

        @InjectRepository(User)
        private readonly userRepository:
            Repository<User>,

        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository:
            Repository<RefreshToken>,

        private readonly jwtService:
            JwtService,

        private readonly configService:
            ConfigService,

    ) { }


    async register(
        registerDto: RegisterDto,
    ) {
        const email =
            registerDto.email.trim().toLowerCase();

        const existingUser =
            await this.userRepository.findOne({
                where: {
                    email,
                },
            });

        if (existingUser) {
            throw new ConflictException('El correo electrónico ya está registrado.',);
        }

        const passwordHash =
            await bcrypt.hash(registerDto.password, 12,);

        const user =
            this.userRepository.create({

                firstName: registerDto.firstName.trim(),
                lastName: registerDto.lastName.trim(),
                email,
                password: passwordHash,
                role: UserRole.CUSTOMER,
                isActive: true,

            });

        const savedUser = await this.userRepository.save(user,);
        const tokens = await this.generateTokens(savedUser,);

        return {

            ...tokens,

            user: this.toSafeUser(savedUser),

        };
    }

    async login(loginDto: LoginDto,) {

        const email = loginDto.email.trim().toLowerCase();

        const user = await this.userRepository.createQueryBuilder('user').addSelect('user.password')
            .where(
                'user.email = :email',
                { email },
            ).getOne();

        if (!user) {

            throw new UnauthorizedException('Credenciales inválidas.',);
        }

        if (!user.isActive) {

            throw new UnauthorizedException('La cuenta está desactivada.',);
        }

        const passwordMatches =

            await bcrypt.compare(loginDto.password, user.password,);

        if (!passwordMatches) {

            throw new UnauthorizedException('Credenciales inválidas.',);
        }

        const tokens = await this.generateTokens(user,);

        return {

            ...tokens,

            user:
                this.toSafeUser(user),
        };
    }

    async refresh(dto: RefreshTokenDto,) {

        let payload: RefreshTokenPayload;

        try {

            payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {

                secret:
                    this.configService.getOrThrow<string>(
                        'JWT_REFRESH_SECRET',
                    ),
            },

            );

        } catch {

            throw new UnauthorizedException('Refresh token inválido o expirado.',);

        }

        const tokenHash = this.hashToken(dto.refreshToken,);

        const storedToken = await this.refreshTokenRepository.findOne({

            where: {
                tokenHash,
            },

        });

        if (!storedToken) {
            throw new UnauthorizedException('Refresh token inválido.',);
        }

        /*
         * Si un refresh token ya revocado vuelve
         * a utilizarse, asumimos posible robo/replay.
         *
         * Invalidamos todas las sesiones del usuario.
         */
        if (storedToken.revokedAt) {

            await this.revokeAllUserTokens(storedToken.userId,);

            throw new UnauthorizedException('La sesión ya no es válida. Inicia sesión nuevamente.',);
        }

        if (storedToken.expiresAt <= new Date()) {

            storedToken.revokedAt = new Date();

            await this.refreshTokenRepository.save(storedToken,);

            throw new UnauthorizedException('Refresh token expirado.',);
        }

        if (storedToken.userId !== payload.sub) {

            throw new UnauthorizedException('Refresh token inválido.',);
        }

        const user =
            await this.userRepository.findOne({
                where: {
                    id: payload.sub,
                },
            });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('La cuenta no está disponible.',);
        }

        /*
         * Rotación:
         *
         * El token utilizado deja de ser válido
         * y generamos uno completamente nuevo.
         */
        storedToken.revokedAt = new Date();
        await this.refreshTokenRepository.save(storedToken,);
        const tokens = await this.generateTokens(user,);

        return {
            ...tokens, user: this.toSafeUser(user),
        };
    }

    async logout(

        dto: LogoutDto,): Promise<void> {

        const tokenHash = this.hashToken(dto.refreshToken,);
        const token =
            await this.refreshTokenRepository.findOne({
                where: {
                    tokenHash,
                },
            });

        /*
         * Logout debe ser idempotente.
         *
         * Si el token no existe o ya estaba revocado,
         * no necesitamos revelar información adicional.
         */
        if (!token || token.revokedAt) {

            return;
        }

        token.revokedAt = new Date();

        await this.refreshTokenRepository.save(token,);
    }

    private async generateTokens(user: User,) {

        const accessPayload:
            JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const refreshTokenId = randomUUID();
        const refreshPayload: RefreshTokenPayload = {
            sub: user.id,
            jti: refreshTokenId,
        };

        const accessToken =
            await this.jwtService.signAsync(accessPayload,);

        const refreshToken =
            await this.jwtService.signAsync(
                refreshPayload,
                {
                    secret:
                        this.configService.getOrThrow<string>(
                            'JWT_REFRESH_SECRET',
                        ),

                    expiresIn:
                        this.configService.get<string>(
                            'JWT_REFRESH_EXPIRES_IN',
                            '7d',
                        ) as any,
                },
            );

        const expiresAt = this.getRefreshTokenExpirationDate();
        const tokenHash = this.hashToken(

            refreshToken,

        );

        const refreshTokenEntity =
            this.refreshTokenRepository.create({
                id: refreshTokenId,
                userId: user.id,
                tokenHash,
                expiresAt,
                revokedAt: null,
            });

        await this.refreshTokenRepository.save(
            refreshTokenEntity,
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    private getRefreshTokenExpirationDate(): Date {

        const expiration = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d',);
        const match = expiration.match(/^(\d+)([smhd])$/,);

        if (!match) {
            throw new Error('JWT_REFRESH_EXPIRES_IN tiene un formato inválido.',);
        }

        const value =
            Number(match[1]);

        const unit =
            match[2];

        const unitMap: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };

        const milliseconds = unitMap[unit];

        return new Date(Date.now() + value * milliseconds,);
    }

    private hashToken(token: string,): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private async revokeAllUserTokens(userId: string,): Promise<void> {

        await this.refreshTokenRepository.createQueryBuilder().update(RefreshToken).set({
            revokedAt: new Date(),
        }).where(

            'user_id = :userId',
            { userId },

        ).andWhere(

            'revoked_at IS NULL',

        ).execute();
    }

    private toSafeUser(user: User,) {

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        };
    }
}