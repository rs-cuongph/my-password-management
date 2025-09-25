import { PrismaService } from './prisma.service';
export declare class AppService {
    private prisma;
    constructor(prisma: PrismaService);
    getHello(): string;
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        database: string;
        environment: string;
        error?: undefined;
    } | {
        status: string;
        timestamp: string;
        database: string;
        environment: string;
        error: string;
    }>;
}
