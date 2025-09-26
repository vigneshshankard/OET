"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
class JwtService {
    constructor(config) {
        this.config = config;
    }
    generateAccessToken(payload) {
        return jwt.sign(payload, this.config.secret, {
            expiresIn: this.config.accessExpiry,
            issuer: 'oet-praxis',
            audience: 'oet-praxis-app',
        });
    }
    generateRefreshToken(userId) {
        return jwt.sign({ sub: userId }, this.config.refreshSecret, {
            expiresIn: this.config.refreshExpiry,
            issuer: 'oet-praxis',
            audience: 'oet-praxis-app',
        });
    }
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.config.secret, {
                issuer: 'oet-praxis',
                audience: 'oet-praxis-app',
            });
        }
        catch (error) {
            throw new Error('Invalid access token');
        }
    }
    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, this.config.refreshSecret, {
                issuer: 'oet-praxis',
                audience: 'oet-praxis-app',
            });
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    decodeToken(token) {
        try {
            return jwt.decode(token);
        }
        catch (error) {
            return null;
        }
    }
    isTokenExpired(token) {
        const decoded = this.decodeToken(token);
        if (!decoded || !decoded.exp)
            return true;
        const currentTime = Math.floor(Date.now() / 1000);
        return decoded.exp < currentTime;
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
    generateTokenPair(payload) {
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
    parseExpiry(expiry) {
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
exports.JwtService = JwtService;
//# sourceMappingURL=jwt.js.map