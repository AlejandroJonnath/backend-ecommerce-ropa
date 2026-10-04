//Para entrar a este endpoint necesitas presentar un JWT válido.

import {
    Injectable,
} from '@nestjs/common';

import {
    AuthGuard,
} from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard
    extends AuthGuard('jwt') { }