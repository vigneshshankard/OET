import { JwtPayload } from '../types/common';
export interface JwtConfig {
    secret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
}
export declare class JwtService {
    private config;
    constructor(config: JwtConfig);
    generateAccessToken(payload: Omit<JwtPayload, 'exp' | 'iat'>): string;
    generateRefreshToken(userId: string): string;
    verifyAccessToken(token: string): JwtPayload;
    verifyRefreshToken(token: string): {
        sub: string;
    };
    decodeToken(token: string): JwtPayload | null;
    isTokenExpired(token: string): boolean;
    extractTokenFromHeader(authHeader: string): string | null;
    generateTokenPair(payload: Omit<JwtPayload, 'exp' | 'iat'>): {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    private parseExpiry;
}
//# sourceMappingURL=jwt.d.ts.map