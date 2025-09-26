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
      // Test database connection with timeout
      const dbTestPromise = this.prisma.$queryRaw`SELECT 1 as test`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 5000),
      );

      await Promise.race([dbTestPromise, timeoutPromise]);

      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'Connected',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };
    } catch (error) {
      return {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        database: 'Disconnected',
        environment: process.env.NODE_ENV || 'development',
        error: error instanceof Error ? error.message : 'Unknown error',
        uptime: process.uptime(),
      };
    }
  }
}
