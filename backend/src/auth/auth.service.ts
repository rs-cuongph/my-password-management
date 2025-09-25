import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { username, email, password } = registerDto;

    // Check if username or email already exists
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
        throw new ConflictException('Username đã tồn tại');
      }
      if (existingUser.email === email) {
        throw new ConflictException('Email đã tồn tại');
      }
    }

    // Generate random kdfSalt for client-side key derivation
    const kdfSalt = crypto.randomBytes(32).toString('hex');

    // Hash password for server authentication
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
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
}