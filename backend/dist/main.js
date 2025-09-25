"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const security_service_1 = require("./security/security.service");
const security_exception_filter_1 = require("./common/filters/security-exception.filter");
const security_validation_pipe_1 = require("./common/pipes/security-validation.pipe");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const securityService = app.get(security_service_1.SecurityService);
    app.use((0, helmet_1.default)(securityService.getHelmetConfig()));
    app.use((0, cors_1.default)(securityService.getCorsConfig()));
    app.useGlobalFilters(new security_exception_filter_1.SecurityExceptionFilter());
    app.useGlobalPipes(new security_validation_pipe_1.SecurityValidationPipe());
    const apiPrefix = configService.get('API_PREFIX') || 'api';
    const apiVersion = configService.get('API_VERSION') || 'v1';
    app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
    const port = configService.get('BACKEND_PORT') || 3001;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
    console.log(`🔒 Security middleware enabled`);
}
void bootstrap();
//# sourceMappingURL=main.js.map