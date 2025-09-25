import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { Setup2faDto, Setup2faResponseDto } from './dto/setup-2fa.dto';
import { Verify2faDto, Verify2faResponseDto } from './dto/verify-2fa.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<RegisterResponseDto>;
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    setup2fa(setup2faDto: Setup2faDto): Promise<Setup2faResponseDto>;
    verify2fa(verify2faDto: Verify2faDto): Promise<Verify2faResponseDto>;
}
