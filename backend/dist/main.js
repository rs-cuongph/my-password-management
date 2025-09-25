"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
    }));
    if (configService.get('CORS_ENABLED')) {
        app.enableCors({
            origin: configService.get('CORS_ORIGIN'),
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            credentials: true,
        });
    }
    const apiPrefix = configService.get('API_PREFIX') || 'api';
    const apiVersion = configService.get('API_VERSION') || 'v1';
    app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
    const port = configService.get('BACKEND_PORT') || 3001;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map