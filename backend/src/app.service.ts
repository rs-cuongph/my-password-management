import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'Connected',
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        database: 'Disconnected',
        environment: process.env.NODE_ENV || 'development',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
