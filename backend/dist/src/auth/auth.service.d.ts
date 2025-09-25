import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaService);
    register(registerDto: RegisterDto): Promise<RegisterResponseDto>;
}
