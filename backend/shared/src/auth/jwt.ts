import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/common';

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessExpiry: string;
  refreshExpiry: string;
}

export class JwtService {
  constructor(private config: JwtConfig) {}

  generateAccessToken(payload: Omit<JwtPayload, 'exp' | 'iat'>): string {
    return jwt.sign(
      payload,
      this.config.secret,
      {
        expiresIn: this.config.accessExpiry as string,
        issuer: 'oet-praxis',
        audience: 'oet-praxis-app',
      }
    );
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { sub: userId },
      this.config.refreshSecret,
      {
        expiresIn: this.config.refreshExpiry,
        issuer: 'oet-praxis',
        audience: 'oet-praxis-app',
      }
    );
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.config.secret, {
        issuer: 'oet-praxis',
        audience: 'oet-praxis-app',
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): { sub: string } {
    try {
      return jwt.verify(token, this.config.refreshSecret, {
        issuer: 'oet-praxis',
        audience: 'oet-praxis-app',
      }) as { sub: string };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  generateTokenPair(payload: Omit<JwtPayload, 'exp' | 'iat'>): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload.sub);
    
    // Convert expiry string to seconds (assuming format like "15m", "7d")
    const expiresIn = this.parseExpiry(this.config.accessExpiry);
    
    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private parseExpiry(expiry: string): number {
    const value = parseInt(expiry.slice(0, -1));
    const unit = expiry.slice(-1);
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900; // 15 minutes default
    }
  }
}