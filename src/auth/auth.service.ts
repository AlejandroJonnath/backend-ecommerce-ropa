import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
    User,
    UserRole,
} from '../users/entities/user.entity.js';

import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtPayload } from './types/jwt-payload.type.js';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const email = registerDto.email
            .trim()
            .toLowerCase();

        const existingUser =
            await this.userRepository.findOne({
                where: {
                    email,
                },
            });

        if (existingUser) {
            throw new ConflictException(
                'El correo electrónico ya está registrado.',
            );
        }

        const passwordHash =
            await bcrypt.hash(
                registerDto.password,
                12,
            );

        const user =
            this.userRepository.create({
                firstName:
                    registerDto.firstName.trim(),

                lastName:
                    registerDto.lastName.trim(),

                email,

                password: passwordHash,

                role: UserRole.CUSTOMER,

                isActive: true,
            });

        const savedUser =
            await this.userRepository.save(user);

        const token =
            await this.generateAccessToken(
                savedUser,
            );

        return {
            accessToken: token,

            user: {
                id: savedUser.id,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                email: savedUser.email,
                role: savedUser.role,
            },
        };
    }

    async login(loginDto: LoginDto) {
        const email = loginDto.email
            .trim()
            .toLowerCase();

        /*
         * La contraseña tiene select: false
         * en User, por lo que debemos solicitarla explícitamente.
         */
        const user =
            await this.userRepository
                .createQueryBuilder('user')
                .addSelect('user.password')
                .where('user.email = :email', {
                    email,
                })
                .getOne();

        if (!user) {
            throw new UnauthorizedException(
                'Credenciales inválidas.',
            );
        }

        if (!user.isActive) {
            throw new UnauthorizedException(
                'La cuenta está desactivada.',
            );
        }

        const passwordMatches =
            await bcrypt.compare(
                loginDto.password,
                user.password,
            );

        if (!passwordMatches) {
            throw new UnauthorizedException(
                'Credenciales inválidas.',
            );
        }

        const token =
            await this.generateAccessToken(user);

        return {
            accessToken: token,

            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        };
    }

    private async generateAccessToken(
        user: User,
    ): Promise<string> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.signAsync(
            payload,
        );
    }
}