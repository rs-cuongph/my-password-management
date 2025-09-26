import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { VaultService } from '../vault.service';
import { PrismaService } from '../../../prisma.service';
import { SaveVaultRequestDto } from '../../dto/vault.dto';
import { EncryptedVaultPayloadDto } from '../../dto/vault-payload.dto';

describe('VaultService', () => {
  let service: VaultService;
  let prismaService: PrismaService;

  // Mock data
  const mockEncryptedPayload: EncryptedVaultPayloadDto = {
    encryptedData: 'dGVzdCBlbmNyeXB0ZWQgZGF0YQ==', // base64 encoded test data
    nonce: 'dGVzdCBub25jZSAxMjM0NTY3ODkw', // 24 bytes base64
    tag: 'dGVzdCB0YWcxMjM0NTY3ODkw', // 16 bytes base64
    compressed: true,
    algorithm: 'xchacha20-poly1305' as const,
    version: 1,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockSaveVaultRequest: SaveVaultRequestDto = {
    kdfJson: {
      salt: 'dGVzdCBzYWx0',
      iterations: 100000,
      memorySize: 64,
      parallelism: 1,
    },
    wrappedDek: 'dGVzdCB3cmFwcGVkIGRlaw==',
    blobCiphertext: mockEncryptedPayload,
    expectedVersion: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultService,
        {
          provide: PrismaService,
          useValue: {
            // Mock Prisma service methods
            vault: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VaultService>(VaultService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVaultByUserId', () => {
    it('should return null when vault not found', async () => {
      // Mock the private method to return null
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockResolvedValue(null);

      const result = await service.getVaultByUserId('user123');

      expect(result).toBeNull();
      expect(findSpy).toHaveBeenCalledWith('user123');
    });

    it('should return vault data when found', async () => {
      const mockVault = {
        kdfJson: mockSaveVaultRequest.kdfJson,
        wrappedDek: mockSaveVaultRequest.wrappedDek,
        blobCiphertext: mockEncryptedPayload,
        version: 1,
        lastUpdated: new Date('2024-01-01T00:00:00.000Z'),
      };

      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockResolvedValue(mockVault);

      const result = await service.getVaultByUserId('user123');

      expect(result).toEqual({
        kdfJson: mockSaveVaultRequest.kdfJson,
        wrappedDek: mockSaveVaultRequest.wrappedDek,
        blobCiphertext: mockEncryptedPayload,
        version: 1,
        lastUpdated: '2024-01-01T00:00:00.000Z',
        metadata: {
          entryCount: 0,
          boardCount: 0,
          checksum: undefined,
        },
      });
      expect(findSpy).toHaveBeenCalledWith('user123');
    });

    it('should throw HttpException on database error', async () => {
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.getVaultByUserId('user123')).rejects.toThrow(
        HttpException,
      );
      expect(findSpy).toHaveBeenCalledWith('user123');
    });
  });

  describe('saveVault', () => {
    it('should save vault successfully with new version', async () => {
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockResolvedValue(null);
      const upsertSpy = jest
        .spyOn(service as any, 'upsertVault')
        .mockResolvedValue({
          version: 1,
          lastUpdated: new Date(),
        });

      const result = await service.saveVault('user123', mockSaveVaultRequest);

      expect(result.success).toBe(true);
      expect(result.version).toBe(1);
      expect(result.metadata?.previousVersion).toBe(0);
      expect(findSpy).toHaveBeenCalledWith('user123');
      expect(upsertSpy).toHaveBeenCalled();
    });

    it('should increment version when vault exists', async () => {
      const existingVault = {
        version: 5,
        lastUpdated: new Date(),
      };

      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockResolvedValue(existingVault);
      const upsertSpy = jest
        .spyOn(service as any, 'upsertVault')
        .mockResolvedValue({
          version: 6,
          lastUpdated: new Date(),
        });

      const result = await service.saveVault('user123', {
        ...mockSaveVaultRequest,
        expectedVersion: undefined,
      });

      expect(result.success).toBe(true);
      expect(result.version).toBe(6);
      expect(result.metadata?.previousVersion).toBe(5);
      expect(findSpy).toHaveBeenCalledWith('user123');
      expect(upsertSpy).toHaveBeenCalled();
    });

    it('should throw HttpException on database error', async () => {
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        service.saveVault('user123', mockSaveVaultRequest),
      ).rejects.toThrow(HttpException);
      expect(findSpy).toHaveBeenCalledWith('user123');
    });
  });

  describe('getCurrentVersion', () => {
    it('should return current version when vault exists', async () => {
      const mockVault = { version: 5 };
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockResolvedValue(mockVault);

      const result = await service.getCurrentVersion('user123');

      expect(result).toBe(5);
      expect(findSpy).toHaveBeenCalledWith('user123');
    });

    it('should return -1 when vault does not exist', async () => {
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockResolvedValue(null);

      const result = await service.getCurrentVersion('user123');

      expect(result).toBe(-1);
      expect(findSpy).toHaveBeenCalledWith('user123');
    });

    it('should throw HttpException on database error', async () => {
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockRejectedValue(new Error('Database error'));

      await expect(service.getCurrentVersion('user123')).rejects.toThrow(
        HttpException,
      );
      expect(findSpy).toHaveBeenCalledWith('user123');
    });
  });

  describe('getLastUpdated', () => {
    it('should return last updated timestamp when vault exists', async () => {
      const lastUpdated = new Date('2024-01-01T00:00:00.000Z');
      const mockVault = { lastUpdated };
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockResolvedValue(mockVault);

      const result = await service.getLastUpdated('user123');

      expect(result).toEqual(lastUpdated);
      expect(findSpy).toHaveBeenCalledWith('user123');
    });

    it('should return null when vault does not exist', async () => {
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockResolvedValue(null);

      const result = await service.getLastUpdated('user123');

      expect(result).toBeNull();
      expect(findSpy).toHaveBeenCalledWith('user123');
    });
  });

  describe('validateVaultSize', () => {
    it('should pass validation for normal sized vault', async () => {
      await expect(
        service.validateVaultSize(mockSaveVaultRequest),
      ).resolves.not.toThrow();
    });

    it('should throw exception for oversized vault', async () => {
      const oversizedRequest = {
        ...mockSaveVaultRequest,
        blobCiphertext: {
          ...mockEncryptedPayload,
          encryptedData: 'a'.repeat(60 * 1024 * 1024), // 60MB
        },
      };

      await expect(service.validateVaultSize(oversizedRequest)).rejects.toThrow(
        HttpException,
      );
    });

    it('should validate ciphertext format', async () => {
      const invalidRequest = {
        ...mockSaveVaultRequest,
        blobCiphertext: {
          ...mockEncryptedPayload,
          nonce: 'invalid-nonce', // Invalid base64/length
        },
      };

      await expect(service.validateVaultSize(invalidRequest)).rejects.toThrow(
        HttpException,
      );
    });

    it('should reject invalid algorithm', async () => {
      const invalidAlgorithmRequest = {
        ...mockSaveVaultRequest,
        blobCiphertext: {
          ...mockEncryptedPayload,
          algorithm: 'invalid-algorithm' as any,
        },
      };

      await expect(
        service.validateVaultSize(invalidAlgorithmRequest),
      ).rejects.toThrow(HttpException);
    });

    it('should reject missing required fields', async () => {
      const missingFieldsRequest = {
        ...mockSaveVaultRequest,
        blobCiphertext: {
          ...mockEncryptedPayload,
          encryptedData: '',
        },
      };

      await expect(
        service.validateVaultSize(missingFieldsRequest),
      ).rejects.toThrow(HttpException);
    });

    it('should reject invalid nonce size', async () => {
      const invalidNonceRequest = {
        ...mockSaveVaultRequest,
        blobCiphertext: {
          ...mockEncryptedPayload,
          nonce: Buffer.from('short-nonce').toString('base64'), // Wrong size
        },
      };

      await expect(
        service.validateVaultSize(invalidNonceRequest),
      ).rejects.toThrow(HttpException);
    });

    it('should reject invalid tag size', async () => {
      const invalidTagRequest = {
        ...mockSaveVaultRequest,
        blobCiphertext: {
          ...mockEncryptedPayload,
          tag: Buffer.from('short-tag').toString('base64'), // Wrong size
        },
      };

      await expect(
        service.validateVaultSize(invalidTagRequest),
      ).rejects.toThrow(HttpException);
    });

    it('should reject invalid version', async () => {
      const invalidVersionRequest = {
        ...mockSaveVaultRequest,
        blobCiphertext: {
          ...mockEncryptedPayload,
          version: 0, // Invalid version
        },
      };

      await expect(
        service.validateVaultSize(invalidVersionRequest),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('error handling', () => {
    it('should handle and convert generic errors to HttpException', async () => {
      const findSpy = jest
        .spyOn(service as any, 'findVaultByUserId')
        .mockRejectedValue(new Error('Unexpected error'));

      await expect(service.getVaultByUserId('user123')).rejects.toThrow(
        HttpException,
      );

      const thrownError = await service
        .getVaultByUserId('user123')
        .catch((error) => error);
      expect(thrownError).toBeInstanceOf(HttpException);
      expect(thrownError.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
