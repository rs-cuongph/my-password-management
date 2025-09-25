import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe with security options
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto transform payloads
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Enable CORS if configured
  if (configService.get<boolean>('CORS_ENABLED')) {
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN'),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    });
  }

  // Set global prefix
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api';
  const apiVersion = configService.get<string>('API_VERSION') || 'v1';
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  const port = configService.get<number>('BACKEND_PORT') || 3001;
  await app.listen(port);

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}/${apiVersion}`,
  );
}
void bootstrap();
