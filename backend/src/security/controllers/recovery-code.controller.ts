import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Logger,
  HttpStatus,
  HttpException,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecoveryCodeService } from '../services/recovery-code.service';
import {
  GenerateRecoveryCodeDto,
  ValidateRecoveryCodeDto,
  RecoverDEKDto,
  GenerateRecoveryCodeResponseDto,
  ValidateRecoveryCodeResponseDto,
  RecoverDEKResponseDto,
  RecoveryCodeStatsResponseDto,
} from '../dto/recovery-code.dto';

@Controller('security/recovery-code')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class RecoveryCodeController {
  private readonly logger = new Logger(RecoveryCodeController.name);

  // Statistics tracking (in production, this should be persisted in database)
  private stats = {
    totalGenerated: 0,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    lastGenerated: null as Date | null,
    lastRecoveryAttempt: null as Date | null,
  };

  constructor(private readonly recoveryCodeService: RecoveryCodeService) {}

  @Post('generate')
  // @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 per 5 minutes - very restrictive
  async generateRecoveryCode(
    @Body() generateDto: GenerateRecoveryCodeDto,
  ): Promise<GenerateRecoveryCodeResponseDto> {
    try {
      this.logger.log('Recovery code generation requested');

      // Decode DEK from base64
      const dekBuffer = Buffer.from(generateDto.dek, 'base64');
      const dek = new Uint8Array(dekBuffer);

      // Validate DEK size (should be 256 bits / 32 bytes)
      if (dek.length !== 32) {
        throw new HttpException('Invalid DEK size', HttpStatus.BAD_REQUEST);
      }

      // Generate recovery code system
      const result =
        await this.recoveryCodeService.generateRecoveryCodeForDEK(dek);

      // Update statistics
      this.stats.totalGenerated++;
      this.stats.lastGenerated = new Date();

      const response: GenerateRecoveryCodeResponseDto = {
        recoveryCode: {
          code: result.recoveryCode.code,
          salt: result.recoveryCode.salt,
          createdAt: result.recoveryCode.createdAt.toISOString(),
          version: result.recoveryCode.version,
          instructions: result.instructions,
        },
        wrappedDEK: {
          encryptedDEK: result.wrappedDEK.encryptedDEK,
          nonce: result.wrappedDEK.nonce,
          tag: result.wrappedDEK.tag,
          metadata: {
            version: result.wrappedDEK.metadata.version,
            createdAt: result.wrappedDEK.metadata.createdAt.toISOString(),
            algorithm: result.wrappedDEK.metadata.algorithm,
            purpose: result.wrappedDEK.metadata.purpose,
          },
        },
        success: true,
        message:
          'Recovery code generated successfully. Store it securely offline.',
      };

      this.logger.log('Recovery code generated successfully');
      return response;
    } catch (error: any) {
      this.logger.error('Recovery code generation failed', error);
      throw new HttpException(
        error.message || 'Recovery code generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('validate')
  // @Throttle({ default: { limit: 10, ttl: 300000 } }) // 10 per 5 minutes
  async validateRecoveryCode(
    @Body() validateDto: ValidateRecoveryCodeDto,
  ): Promise<ValidateRecoveryCodeResponseDto> {
    try {
      this.logger.log('Recovery code validation requested');

      const validationResult =
        await this.recoveryCodeService.validateRecoveryCode(
          validateDto.recoveryCode,
          validateDto.salt,
        );

      const response: ValidateRecoveryCodeResponseDto = {
        valid: validationResult.valid,
        error: validationResult.valid
          ? undefined
          : 'Invalid recovery code format or derivation failed',
        message: validationResult.valid
          ? 'Recovery code is valid'
          : 'Recovery code validation failed',
      };

      this.logger.log(
        `Recovery code validation: ${validationResult.valid ? 'success' : 'failed'}`,
      );
      return response;
    } catch (error) {
      this.logger.error('Recovery code validation failed', error);
      return {
        valid: false,
        error: error.message || 'Validation failed',
        message: 'Recovery code validation encountered an error',
      };
    }
  }

  @Post('recover-dek')
  // @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 per 15 minutes - very restrictive for security
  async recoverDEK(
    @Body() recoverDto: RecoverDEKDto,
  ): Promise<RecoverDEKResponseDto> {
    let recoverySuccessful = false;

    try {
      this.logger.log('DEK recovery attempt started');

      // Update attempt statistics
      this.stats.lastRecoveryAttempt = new Date();

      // Step 1: Validate recovery code format
      const codeFormatValid =
        /^[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}$/.test(
          recoverDto.recoveryCode,
        );
      if (!codeFormatValid) {
        this.stats.failedRecoveries++;
        return {
          success: false,
          error: 'Invalid recovery code format',
          context: {
            codeFormatValid: false,
            saltValid: false,
            keyDerivationSucceeded: false,
            unwrappingSucceeded: false,
          },
        };
      }

      // Step 2: Validate salt format
      let saltValid = true;
      try {
        Buffer.from(recoverDto.salt, 'base64');
      } catch {
        saltValid = false;
      }

      if (!saltValid) {
        this.stats.failedRecoveries++;
        return {
          success: false,
          error: 'Invalid salt format',
          context: {
            codeFormatValid: true,
            saltValid: false,
            keyDerivationSucceeded: false,
            unwrappingSucceeded: false,
          },
        };
      }

      // Step 3: Derive recovery key
      let recoveryKey: Uint8Array;
      let keyDerivationSucceeded = false;

      try {
        recoveryKey = await this.recoveryCodeService.deriveRecoveryKey(
          recoverDto.recoveryCode,
          recoverDto.salt,
          recoverDto.derivationParams,
        );
        keyDerivationSucceeded = true;
      } catch (error) {
        this.stats.failedRecoveries++;
        return {
          success: false,
          error: 'Recovery key derivation failed',
          context: {
            codeFormatValid: true,
            saltValid: true,
            keyDerivationSucceeded: false,
            unwrappingSucceeded: false,
          },
        };
      }

      // Step 4: Attempt to unwrap DEK
      const wrappedDEK = {
        encryptedDEK: recoverDto.encryptedDEK,
        nonce: recoverDto.nonce,
        tag: recoverDto.tag,
        metadata: {
          version: 1,
          createdAt: new Date(),
          algorithm: 'xchacha20-poly1305' as const,
          purpose: 'recovery' as const,
        },
      };

      const unwrapResult =
        await this.recoveryCodeService.unwrapDEKWithRecoveryKey(
          wrappedDEK,
          recoveryKey,
        );

      if (unwrapResult.success) {
        recoverySuccessful = true;
        this.stats.successfulRecoveries++;

        this.logger.log('DEK recovery successful');
        return {
          success: true,
          dek: Buffer.from(unwrapResult.dek).toString('base64'),
          context: {
            codeFormatValid: true,
            saltValid: true,
            keyDerivationSucceeded: true,
            unwrappingSucceeded: true,
          },
        };
      } else {
        this.stats.failedRecoveries++;
        return {
          success: false,
          error:
            'DEK unwrapping failed - invalid recovery code or corrupted data',
          context: {
            codeFormatValid: true,
            saltValid: true,
            keyDerivationSucceeded: true,
            unwrappingSucceeded: false,
          },
        };
      }
    } catch (error) {
      this.logger.error('DEK recovery failed', error);
      this.stats.failedRecoveries++;

      return {
        success: false,
        error: error.message || 'DEK recovery failed',
        context: {
          codeFormatValid: false,
          saltValid: false,
          keyDerivationSucceeded: false,
          unwrappingSucceeded: false,
        },
      };
    } finally {
      if (recoverySuccessful) {
        this.logger.log('DEK recovery completed successfully');
      } else {
        this.logger.warn('DEK recovery attempt failed');
      }
    }
  }

  @Get('stats')
  // @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 per minute
  getRecoveryCodeStats(): RecoveryCodeStatsResponseDto {
    try {
      const totalAttempts =
        this.stats.successfulRecoveries + this.stats.failedRecoveries;
      const successRate =
        totalAttempts > 0
          ? (this.stats.successfulRecoveries / totalAttempts) * 100
          : 0;

      return {
        totalGenerated: this.stats.totalGenerated,
        successfulRecoveries: this.stats.successfulRecoveries,
        failedRecoveries: this.stats.failedRecoveries,
        lastGenerated: this.stats.lastGenerated?.toISOString(),
        lastRecoveryAttempt: this.stats.lastRecoveryAttempt?.toISOString(),
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      this.logger.error('Failed to get recovery code stats', error);
      throw new HttpException(
        'Failed to retrieve statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
