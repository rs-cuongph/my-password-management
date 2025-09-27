import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import { DEKService } from '../services/dek.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SensitiveRateLimit } from '../../common/decorators/rate-limit.decorator';
import {
  GenerateDEKRequestDto,
  GenerateDEKResponseDto,
  WrapDEKRequestDto,
  WrapDEKResponseDto,
  UnwrapDEKRequestDto,
  UnwrapDEKResponseDto,
  GetKeyRotationInfoRequestDto,
  GetKeyRotationInfoResponseDto,
  RotateDEKRequestDto,
  RotateDEKResponseDto,
} from '../dto/dek.dto';

@Controller('security/dek')
@UseGuards(JwtAuthGuard)
export class DEKController {
  constructor(private readonly dekService: DEKService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  // @SensitiveRateLimit()
  async generateDEK(
    @Body() request: GenerateDEKRequestDto,
  ): Promise<GenerateDEKResponseDto> {
    const result = await this.dekService.generateDEK({
      version: request.version,
      aad: request.aad,
    });

    // Convert DEK to base64 for transport
    const response: GenerateDEKResponseDto = {
      dek: Buffer.from(result.dek).toString('base64'),
      metadata: {
        version: result.metadata.version,
        createdAt: result.metadata.createdAt.toISOString(),
        algorithm: result.metadata.algorithm,
        kdf: result.metadata.kdf,
      },
    };

    // Clear the original DEK from memory
    this.dekService.clearMemory(result.dek);

    return response;
  }

  @Post('wrap')
  @HttpCode(HttpStatus.OK)
  // @SensitiveRateLimit()
  async wrapDEK(
    @Body() request: WrapDEKRequestDto,
  ): Promise<WrapDEKResponseDto> {
    // Convert base64 inputs to Uint8Array
    const dek = new Uint8Array(Buffer.from(request.dek, 'base64'));
    const masterKey = new Uint8Array(Buffer.from(request.masterKey, 'base64'));
    const nonce = request.nonce
      ? new Uint8Array(Buffer.from(request.nonce, 'base64'))
      : undefined;

    try {
      const wrappedDEK = await this.dekService.wrapDEK(dek, masterKey, {
        version: request.version,
        aad: request.aad,
        nonce,
      });

      const response: WrapDEKResponseDto = {
        wrappedDEK: {
          encryptedDEK: wrappedDEK.encryptedDEK,
          nonce: wrappedDEK.nonce,
          tag: wrappedDEK.tag,
          metadata: {
            version: wrappedDEK.metadata.version,
            createdAt: wrappedDEK.metadata.createdAt.toISOString(),
            algorithm: wrappedDEK.metadata.algorithm,
            kdf: wrappedDEK.metadata.kdf,
          },
        },
      };

      return response;
    } finally {
      // Clear sensitive data from memory
      this.dekService.clearMemory([dek, masterKey]);
    }
  }

  @Post('unwrap')
  @HttpCode(HttpStatus.OK)
  // @SensitiveRateLimit()
  async unwrapDEK(
    @Body() request: UnwrapDEKRequestDto,
  ): Promise<UnwrapDEKResponseDto> {
    // Convert base64 master key to Uint8Array
    const masterKey = new Uint8Array(Buffer.from(request.masterKey, 'base64'));

    // Convert DTO to interface
    const wrappedDEK = {
      encryptedDEK: request.wrappedDEK.encryptedDEK,
      nonce: request.wrappedDEK.nonce,
      tag: request.wrappedDEK.tag,
      metadata: {
        version: request.wrappedDEK.metadata.version,
        createdAt: new Date(request.wrappedDEK.metadata.createdAt),
        algorithm: request.wrappedDEK.metadata
          .algorithm as 'xchacha20-poly1305',
        kdf: request.wrappedDEK.metadata.kdf,
      },
    };

    try {
      const result = await this.dekService.unwrapDEK(wrappedDEK, masterKey, {
        aad: request.aad,
      });

      const response: UnwrapDEKResponseDto = {
        dek: Buffer.from(result.dek).toString('base64'),
        metadata: {
          version: result.metadata.version,
          createdAt: result.metadata.createdAt.toISOString(),
          algorithm: result.metadata.algorithm,
          kdf: result.metadata.kdf,
        },
      };

      // Clear the original DEK from memory
      this.dekService.clearMemory(result.dek);

      return response;
    } finally {
      // Clear sensitive data from memory
      this.dekService.clearMemory(masterKey);
    }
  }

  @Post('rotation-info')
  @HttpCode(HttpStatus.OK)
  getKeyRotationInfo(
    @Body() request: GetKeyRotationInfoRequestDto,
  ): GetKeyRotationInfoResponseDto {
    // Convert DTOs to interfaces
    const wrappedDEKs = request.wrappedDEKs.map((dek) => ({
      encryptedDEK: dek.encryptedDEK,
      nonce: dek.nonce,
      tag: dek.tag,
      metadata: {
        version: dek.metadata.version,
        createdAt: new Date(dek.metadata.createdAt),
        algorithm: dek.metadata.algorithm as 'xchacha20-poly1305',
        kdf: dek.metadata.kdf,
      },
    }));

    const rotationInfo = this.dekService.getKeyRotationInfo(wrappedDEKs);

    return {
      rotationInfo: {
        currentVersion: rotationInfo.currentVersion,
        availableVersions: rotationInfo.availableVersions,
        rotationNeeded: rotationInfo.rotationNeeded,
      },
    };
  }

  @Post('rotate')
  @HttpCode(HttpStatus.OK)
  // @SensitiveRateLimit()
  async rotateDEK(
    @Body() request: RotateDEKRequestDto,
  ): Promise<RotateDEKResponseDto> {
    // Convert base64 keys to Uint8Array
    const oldMasterKey = new Uint8Array(
      Buffer.from(request.oldMasterKey, 'base64'),
    );
    const newMasterKey = new Uint8Array(
      Buffer.from(request.newMasterKey, 'base64'),
    );

    // Convert DTO to interface
    const wrappedDEK = {
      encryptedDEK: request.wrappedDEK.encryptedDEK,
      nonce: request.wrappedDEK.nonce,
      tag: request.wrappedDEK.tag,
      metadata: {
        version: request.wrappedDEK.metadata.version,
        createdAt: new Date(request.wrappedDEK.metadata.createdAt),
        algorithm: request.wrappedDEK.metadata
          .algorithm as 'xchacha20-poly1305',
        kdf: request.wrappedDEK.metadata.kdf,
      },
    };

    try {
      const rotatedDEK = await this.dekService.rotateDEK(
        wrappedDEK,
        oldMasterKey,
        newMasterKey,
        request.newVersion,
      );

      const response: RotateDEKResponseDto = {
        wrappedDEK: {
          encryptedDEK: rotatedDEK.encryptedDEK,
          nonce: rotatedDEK.nonce,
          tag: rotatedDEK.tag,
          metadata: {
            version: rotatedDEK.metadata.version,
            createdAt: rotatedDEK.metadata.createdAt.toISOString(),
            algorithm: rotatedDEK.metadata.algorithm,
            kdf: rotatedDEK.metadata.kdf,
          },
        },
      };

      return response;
    } finally {
      // Clear sensitive data from memory
      this.dekService.clearMemory([oldMasterKey, newMasterKey]);
    }
  }

  @Get('master-key/generate')
  @HttpCode(HttpStatus.OK)
  // @SensitiveRateLimit()
  async generateMasterKey(): Promise<{ masterKey: string }> {
    const masterKey = await this.dekService.generateMasterKey();

    try {
      return {
        masterKey: Buffer.from(masterKey).toString('base64'),
      };
    } finally {
      // Clear the original key from memory
      this.dekService.clearMemory(masterKey);
    }
  }

  @Post('master-key/derive')
  @HttpCode(HttpStatus.OK)
  // @SensitiveRateLimit()
  async deriveMasterKey(
    @Body() request: { password: string; salt?: string },
  ): Promise<{ masterKey: string; salt: string }> {
    // Generate salt if not provided
    const saltBytes = request.salt
      ? new Uint8Array(Buffer.from(request.salt, 'base64'))
      : await this.dekService.generateSalt();

    try {
      const masterKey = await this.dekService.deriveMasterKey(
        request.password,
        saltBytes,
      );

      const response = {
        masterKey: Buffer.from(masterKey).toString('base64'),
        salt: Buffer.from(saltBytes).toString('base64'),
      };

      // Clear sensitive data from memory
      this.dekService.clearMemory(masterKey);

      return response;
    } finally {
      if (!request.salt) {
        // Clear generated salt if we created it
        this.dekService.clearMemory(saltBytes);
      }
    }
  }
}
