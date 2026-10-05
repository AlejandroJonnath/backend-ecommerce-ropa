export interface RefreshTokenPayload {
    sub: string;
    jti: string; //Identificará específicamente la sesión/token.
}