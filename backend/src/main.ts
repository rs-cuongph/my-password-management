import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cors from 'cors';
import { SecurityService } from './security/security.service';
import { SecurityExceptionFilter } from './common/filters/security-exception.filter';
import { SecurityValidationPipe } from './common/pipes/security-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const securityService = app.get(SecurityService);

  // Security middleware
  app.use(helmet(securityService.getHelmetConfig()));
  app.use(cors(securityService.getCorsConfig()));

  // Global exception filter
  app.useGlobalFilters(new SecurityExceptionFilter());

  // Global validation pipe with enhanced security
  app.useGlobalPipes(new SecurityValidationPipe());

  // Set global prefix
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api';
  const apiVersion = configService.get<string>('API_VERSION') || 'v1';
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  const port = configService.get<number>('BACKEND_PORT') || 3001;
  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`,
  );
  console.log(`🔒 Security middleware enabled`);
}
void bootstrap();
