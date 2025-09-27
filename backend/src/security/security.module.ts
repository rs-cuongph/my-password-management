import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityService } from './security.service';
import { SecurityMiddleware } from './security.middleware';
import { DEKService } from './services/dek.service';
import { DEKController } from './controllers/dek.controller';
import { VaultPayloadService } from './services/vault-payload.service';
import { VaultPayloadController } from './controllers/vault-payload.controller';
import { RecoveryCodeService } from './services/recovery-code.service';
import { RecoveryCodeController } from './controllers/recovery-code.controller';
import { VaultService } from './services/vault.service';
import { VaultController } from './controllers/vault.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [
    DEKController,
    VaultPayloadController,
    RecoveryCodeController,
    VaultController,
  ],
  providers: [
    SecurityService,
    SecurityMiddleware,
    DEKService,
    VaultPayloadService,
    RecoveryCodeService,
    VaultService,
    PrismaService,
  ],
  exports: [
    SecurityService,
    SecurityMiddleware,
    DEKService,
    VaultPayloadService,
    RecoveryCodeService,
    VaultService,
  ],
})
export class SecurityModule {}
