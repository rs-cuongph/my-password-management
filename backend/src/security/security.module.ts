import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityService } from './security.service';
import { SecurityMiddleware } from './security.middleware';
import { SecurityController } from './security.controller';
import { DEKService } from './services/dek.service';
import { DEKController } from './controllers/dek.controller';
import { KeyRotationService } from './services/key-rotation.service';

@Module({
  imports: [ConfigModule],
  controllers: [SecurityController, DEKController],
  providers: [SecurityService, SecurityMiddleware, DEKService, KeyRotationService],
  exports: [SecurityService, SecurityMiddleware, DEKService, KeyRotationService],
})
export class SecurityModule {}