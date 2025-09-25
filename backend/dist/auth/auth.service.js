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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma.service");
const encryption_util_1 = require("./utils/encryption.util");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const speakeasy = __importStar(require("speakeasy"));
const QRCode = __importStar(require("qrcode"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(registerDto) {
        const { username, email, password } = registerDto;
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
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
                kdfSalt,
            },
        });
        return {
            userId: user.id,
            kdfSalt: user.kdfSalt,
        };
    }
    async login(loginDto) {
        const { username, password } = loginDto;
        try {
            const user = await this.prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    username: true,
                    password: true,
                    kdfSalt: true,
                    need2fa: true,
                    isActive: true,
                },
            });
            const invalidCredentialsMessage = 'Tên đăng nhập hoặc mật khẩu không chính xác';
            if (!user) {
                return {
                    success: false,
                    need2fa: false,
                    kdfSalt: '',
                    message: invalidCredentialsMessage,
                };
            }
            if (!user.isActive) {
                return {
                    success: false,
                    need2fa: false,
                    kdfSalt: '',
                    message: 'Tài khoản đã bị vô hiệu hóa',
                };
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    need2fa: false,
                    kdfSalt: '',
                    message: invalidCredentialsMessage,
                };
            }
            const tempTokenPayload = {
                sub: user.id,
                username: user.username,
                type: 'temp',
            };
            const tempToken = this.jwtService.sign(tempTokenPayload, {
                expiresIn: '15m',
            });
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
            console.error('Login error:', error);
            throw new common_1.BadRequestException('Đã xảy ra lỗi trong quá trình đăng nhập');
        }
    }
    async setup2fa(setup2faDto) {
        const { tempToken } = setup2faDto;
        try {
            const payload = this.jwtService.verify(tempToken);
            if (payload.type !== 'temp') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, username: true, email: true, totpSecret: true },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            if (user.totpSecret) {
                return {
                    success: false,
                    otpauthUri: '',
                    message: '2FA đã được kích hoạt cho tài khoản này',
                };
            }
            const secret = speakeasy.generateSecret({
                name: `Vibe Kanban (${user.username})`,
                issuer: 'Vibe Kanban',
                length: 32,
            });
            const encryptionKey = this.configService.get('TOTP_ENCRYPTION_KEY');
            if (!encryptionKey) {
                throw new common_1.BadRequestException('TOTP encryption key not configured');
            }
            const encryptedSecret = encryption_util_1.EncryptionUtil.encrypt(secret.base32, encryptionKey);
            await this.prisma.user.update({
                where: { id: user.id },
                data: { totpSecret: encryptedSecret },
            });
            const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);
            return {
                success: true,
                otpauthUri: secret.otpauth_url,
                qrCode: qrCodeDataURL,
                message: 'TOTP secret generated successfully',
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Setup 2FA error:', error);
            throw new common_1.BadRequestException('Đã xảy ra lỗi trong quá trình thiết lập 2FA');
        }
    }
    async verify2fa(verify2faDto) {
        const { tempToken, totpCode } = verify2faDto;
        try {
            const payload = this.jwtService.verify(tempToken);
            if (payload.type !== 'temp') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, username: true, totpSecret: true },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            if (!user.totpSecret) {
                throw new common_1.BadRequestException('2FA chưa được thiết lập');
            }
            const encryptionKey = this.configService.get('TOTP_ENCRYPTION_KEY');
            if (!encryptionKey) {
                throw new common_1.BadRequestException('TOTP encryption key not configured');
            }
            const decryptedSecret = encryption_util_1.EncryptionUtil.decrypt(user.totpSecret, encryptionKey);
            const verified = speakeasy.totp.verify({
                secret: decryptedSecret,
                encoding: 'base32',
                token: totpCode,
                window: 2,
            });
            if (!verified) {
                return {
                    success: false,
                    message: 'Mã TOTP không chính xác',
                };
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: { need2fa: true },
            });
            const accessTokenPayload = {
                sub: user.id,
                username: user.username,
                type: 'access',
            };
            const accessToken = this.jwtService.sign(accessTokenPayload, {
                expiresIn: '1h',
            });
            return {
                success: true,
                accessToken,
                message: '2FA đã được kích hoạt thành công',
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Verify 2FA error:', error);
            throw new common_1.BadRequestException('Đã xảy ra lỗi trong quá trình xác thực 2FA');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map