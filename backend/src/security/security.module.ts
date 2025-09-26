import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityService } from './security.service';
import { SecurityMiddleware } from './security.middleware';
import { SecurityController } from './security.controller';
import { DEKService } from './services/dek.service';
import { DEKController } from './controllers/dek.controller';
import { KeyRotationService } from './services/key-rotation.service';
import { VaultPayloadService } from './services/vault-payload.service';
import { VaultPayloadController } from './controllers/vault-payload.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SecurityController, DEKController, VaultPayloadController],
  providers: [
    SecurityService,
    SecurityMiddleware,
    DEKService,
    KeyRotationService,
    VaultPayloadService,
  ],
  exports: [
    SecurityService,
    SecurityMiddleware,
    DEKService,
    KeyRotationService,
    VaultPayloadService,
  ],
})
export class SecurityModule {}
