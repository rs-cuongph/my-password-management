import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
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
