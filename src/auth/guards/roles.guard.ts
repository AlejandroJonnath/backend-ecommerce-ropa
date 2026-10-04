import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../../users/entities/user.entity.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import { JwtPayload } from "../types/jwt-payload.type.js";
import { Observable } from "rxjs";

@Injectable()
export class RolesGuard
    implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
    ) { }

    canActivate(
        context: ExecutionContext,
    ): boolean {
        const requiredRoles =
            this.reflector.getAllAndOverride<
                UserRole[]
            >(ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

        /*
         * Si el endpoint no especifica roles,
         * cualquier usuario autenticado puede continuar.
         */
        if (!requiredRoles?.length) {
            return true;
        }

        const request =
            context.switchToHttp().getRequest<{
                user: JwtPayload;
            }>();

        const user =
            request.user;

        if (!user) {
            throw new ForbiddenException(
                'Usuario no autenticado.',
            );
        }

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