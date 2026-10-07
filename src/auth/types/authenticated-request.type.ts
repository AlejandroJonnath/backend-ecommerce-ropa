import { Request } from 'express';

import { UserRole } from '../../users/entities/user.entity.js';

export interface AuthenticatedUser {
    sub: string;
    email: string;
    role: UserRole;
}

export type AuthenticatedRequest = Request & {
    user: AuthenticatedUser;
};