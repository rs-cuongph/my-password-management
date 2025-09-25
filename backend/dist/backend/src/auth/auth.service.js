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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const { username, email, password } = registerDto;
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });
        if (existingUser) {
            if (existingUser.username === username) {
                throw new common_1.ConflictException('Username đã tồn tại');
            }
            if (existingUser.email === email) {
                throw new common_1.ConflictException('Email đã tồn tại');
            }
        }
        const kdfSalt = crypto.randomBytes(32).toString('hex');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = await this.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                kdfSalt
            }
        });
        return {
            userId: user.id,
            kdfSalt: user.kdfSalt
        };
    }
    async login(loginDto) {
        const { username, password } = loginDto;
        try {
            const user = await this.prisma.user.findUnique({
                where: { username },
            });
            if (!user || !user.isActive) {
                this.logger.warn(`Failed login attempt for username: ${username}`);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                this.logger.warn(`Invalid password for username: ${username}`);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            this.logger.log(`User ${username} authenticated successfully`);
            const payload = {
                sub: user.id,
                username: user.username,
                iat: Math.floor(Date.now() / 1000),
                type: 'temp',
            };
            const tempToken = this.jwtService.sign(payload, { expiresIn: '15m' });
            return {
                success: true,
                tempToken,
                need2fa: user.need2fa,
                kdfSalt: user.kdfSalt,
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Login error for username ${username}:`, error);
            throw new common_1.UnauthorizedException('Authentication failed');
        }
    }
    async validateUser(userId) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    isActive: true,
                    need2fa: true,
                },
            });
            return user?.isActive ? user : null;
        }
        catch (error) {
            this.logger.error('Error validating user:', error);
            return null;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map