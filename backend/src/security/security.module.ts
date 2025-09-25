import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityService } from './security.service';
import { SecurityMiddleware } from './security.middleware';
import { SecurityController } from './security.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SecurityController],
  providers: [SecurityService, SecurityMiddleware],
  exports: [SecurityService, SecurityMiddleware],
})
export class SecurityModule {}