import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    PassportStrategy,
} from '@nestjs/passport';
import {
    ExtractJwt,
    Strategy,
} from 'passport-jwt';

import {
    User,
    UserRole,
} from '../../users/entities/user.entity.js';

import { JwtPayload } from '../types/jwt-payload.type.js';

@Injectable()
export class JwtStrategy
    extends PassportStrategy(Strategy)
{
    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest:
                ExtractJwt.fromAuthHeaderAsBearerToken(),

            ignoreExpiration: false,

            secretOrKey:
                configService.getOrThrow<string>(
                    'JWT_SECRET',
                ),
        });
    }

    async validate(
        payload: JwtPayload,
    ) {
        if (
            !payload.sub ||
            !payload.email ||
            !payload.role
        ) {
            throw new UnauthorizedException(
                'Token inválido.',
            );
        }

        if (
            !Object.values(UserRole).includes(
                payload.role,
            )
        ) {
            throw new UnauthorizedException(
                'Rol inválido.',
            );
        }

        return {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}