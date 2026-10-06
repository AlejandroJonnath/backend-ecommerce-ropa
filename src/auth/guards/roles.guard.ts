import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { UserRole } from '../../users/entities/user.entity.js';

import { ROLES_KEY } from '../decorators/roles.decorator.js';

import { JwtPayload } from '../types/jwt-payload.type.js';

@Injectable()
export class RolesGuard
    implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ) { }

    canActivate(
        context: ExecutionContext,
    ): boolean {
        /**
         * Obtiene los roles requeridos
         * por el endpoint.
         */
        const requiredRoles =
            this.reflector.getAllAndOverride<
                UserRole[]
            >(ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

        /**
         * Si el endpoint no requiere
         * ningún rol específico,
         * permitimos continuar.
         *
         * La autenticación se controla
         * mediante JwtAuthGuard.
         */
        if (!requiredRoles?.length) {
            return true;
        }

        /**
         * Obtenemos el usuario que Passport
         * colocó después de validar el JWT.
         */
        const request =
            context
                .switchToHttp()
                .getRequest<{
                    user: JwtPayload;
                }>();

        const user =
            request.user;

        if (!user) {
            throw new ForbiddenException(
                'Usuario no autenticado.',
            );
        }

        /**
         * Comprobamos si el rol del usuario
         * está dentro de los roles permitidos.
         */
        if (
            !requiredRoles.includes(
                user.role,
            )
        ) {
            throw new ForbiddenException(
                'No tienes permisos para realizar esta operación.',
            );
        }

        return true;
    }
}