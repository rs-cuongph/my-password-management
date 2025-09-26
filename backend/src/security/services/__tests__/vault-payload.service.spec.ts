import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { VaultPayloadService } from '../vault-payload.service';
import { DEKService } from '../dek.service';
import {
  VaultPayload,
  VaultEntry,
  EncryptedVaultPayload,
} from '../../interfaces/vault-payload.interface';

describe('VaultPayloadService', () => {
  let service: VaultPayloadService;
  let dekService: DEKService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultPayloadService,
        DEKService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<VaultPayloadService>(VaultPayloadService);
    dekService = module.get<DEKService>(DEKService);
    configService = module.get<ConfigService>(ConfigService);

    // Wait for libsodium to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('encryptPayload', () => {
    it('should encrypt a valid vault payload', async () => {
      const payload: VaultPayload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const result = await service.encryptPayload(payload, dek);

      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('nonce');
      expect(result).toHaveProperty('tag');
      expect(result).toHaveProperty('compressed');
      expect(result).toHaveProperty('algorithm', 'xchacha20-poly1305');
      expect(result).toHaveProperty('version', 1);
      expect(result).toHaveProperty('createdAt');

      // Verify base64 encoding
      expect(() => Buffer.from(result.encryptedData, 'base64')).not.toThrow();
      expect(() => Buffer.from(result.nonce, 'base64')).not.toThrow();
      expect(() => Buffer.from(result.tag, 'base64')).not.toThrow();

      // Verify nonce and tag sizes
      expect(Buffer.from(result.nonce, 'base64').length).toBe(24); // XChaCha20 nonce size
      expect(Buffer.from(result.tag, 'base64').length).toBe(16); // Poly1305 tag size
    });

    it('should use compression by default', async () => {
      const payload = createLargeTestVaultPayload();
      const dek = await generateTestDEK();

      const result = await service.encryptPayload(payload, dek);

      expect(result.compressed).toBe(true);
    });

    it('should skip compression when disabled', async () => {
      const payload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const result = await service.encryptPayload(payload, dek, {
        compress: false,
      });

      expect(result.compressed).toBe(false);
    });

    it('should use specified compression level', async () => {
      const payload = createLargeTestVaultPayload();
      const dek = await generateTestDEK();

      const result1 = await service.encryptPayload(payload, dek, {
        compressionLevel: 1,
      });
      const result2 = await service.encryptPayload(payload, dek, {
        compressionLevel: 9,
      });

      expect(result1.compressed).toBe(true);
      expect(result2.compressed).toBe(true);
      // Higher compression level should generally result in smaller size
      const size1 = Buffer.from(result1.encryptedData, 'base64').length;
      const size2 = Buffer.from(result2.encryptedData, 'base64').length;
      expect(size2).toBeLessThanOrEqual(size1);
    });

    it('should handle additional authenticated data (AAD)', async () => {
      const payload = createTestVaultPayload();
      const dek = await generateTestDEK();
      const aad = 'test-vault-id';

      const result = await service.encryptPayload(payload, dek, { aad });

      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('nonce');
      expect(result).toHaveProperty('tag');
    });

    it('should reject invalid DEK size', async () => {
      const payload = createTestVaultPayload();
      const invalidDEK = new Uint8Array(16); // Wrong size

      await expect(service.encryptPayload(payload, invalidDEK)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject invalid payload structure', async () => {
      const invalidPayload = { invalid: 'payload' } as any;
      const dek = await generateTestDEK();

      await expect(service.encryptPayload(invalidPayload, dek)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate entry statuses', async () => {
      const payload = createTestVaultPayload();
      payload.entries[0].status = 'invalid-status' as any;
      const dek = await generateTestDEK();

      await expect(service.encryptPayload(payload, dek)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate entry priorities', async () => {
      const payload = createTestVaultPayload();
      payload.entries[0].priority = 'invalid-priority' as any;
      const dek = await generateTestDEK();

      await expect(service.encryptPayload(payload, dek)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('decryptPayload', () => {
    it('should decrypt a valid encrypted payload', async () => {
      const originalPayload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(originalPayload, dek);
      const result = await service.decryptPayload(encrypted, dek);

      expect(result.payload).toEqual(originalPayload);
      expect(result).toHaveProperty('decryptionTime');
      expect(typeof result.decryptionTime).toBe('number');
      expect(result.decryptionTime).toBeGreaterThan(0);
    });

    it('should handle compressed payloads', async () => {
      const originalPayload = createLargeTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(originalPayload, dek, {
        compress: true,
      });
      expect(encrypted.compressed).toBe(true);

      const result = await service.decryptPayload(encrypted, dek);

      expect(result.payload).toEqual(originalPayload);
      expect(result).toHaveProperty('compressionRatio');
      expect(typeof result.compressionRatio).toBe('number');
      expect(result.compressionRatio).toBeLessThan(1);
    });

    it('should handle uncompressed payloads', async () => {
      const originalPayload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(originalPayload, dek, {
        compress: false,
      });
      expect(encrypted.compressed).toBe(false);

      const result = await service.decryptPayload(encrypted, dek);

      expect(result.payload).toEqual(originalPayload);
      expect(result.compressionRatio).toBeUndefined();
    });

    it('should verify AAD during decryption', async () => {
      const payload = createTestVaultPayload();
      const dek = await generateTestDEK();
      const aad = 'test-vault-id';

      const encrypted = await service.encryptPayload(payload, dek, { aad });

      // Correct AAD should work
      const result1 = await service.decryptPayload(encrypted, dek, { aad });
      expect(result1.payload).toEqual(payload);

      // Wrong AAD should fail
      await expect(
        service.decryptPayload(encrypted, dek, { aad: 'wrong-aad' }),
      ).rejects.toThrow(BadRequestException);

      // Missing AAD should fail
      await expect(service.decryptPayload(encrypted, dek)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject tampered ciphertext', async () => {
      const payload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(payload, dek);

      // Tamper with encrypted data
      const tamperedData = Buffer.from(encrypted.encryptedData, 'base64');
      tamperedData[0] = tamperedData[0] ^ 0xff;
      const tamperedEncrypted = {
        ...encrypted,
        encryptedData: tamperedData.toString('base64'),
      };

      await expect(
        service.decryptPayload(tamperedEncrypted, dek),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject tampered tag', async () => {
      const payload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(payload, dek);

      // Tamper with tag
      const tamperedTag = Buffer.from(encrypted.tag, 'base64');
      tamperedTag[0] = tamperedTag[0] ^ 0xff;
      const tamperedEncrypted = {
        ...encrypted,
        tag: tamperedTag.toString('base64'),
      };

      await expect(
        service.decryptPayload(tamperedEncrypted, dek),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject wrong DEK', async () => {
      const payload = createTestVaultPayload();
      const correctDEK = await generateTestDEK();
      const wrongDEK = await generateTestDEK();

      const encrypted = await service.encryptPayload(payload, correctDEK);

      await expect(service.decryptPayload(encrypted, wrongDEK)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should enforce maximum payload size', async () => {
      const largePayload = createLargeTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(largePayload, dek);

      // Should work with default limit
      await expect(
        service.decryptPayload(encrypted, dek),
      ).resolves.toBeDefined();

      // Should fail with very small limit
      await expect(
        service.decryptPayload(encrypted, dek, { maxPayloadSize: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid nonce size', async () => {
      const payload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(payload, dek);

      // Invalid nonce size
      const invalidEncrypted = {
        ...encrypted,
        nonce: Buffer.from('invalid').toString('base64'),
      };

      await expect(
        service.decryptPayload(invalidEncrypted, dek),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid tag size', async () => {
      const payload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(payload, dek);

      // Invalid tag size
      const invalidEncrypted = {
        ...encrypted,
        tag: Buffer.from('invalid').toString('base64'),
      };

      await expect(
        service.decryptPayload(invalidEncrypted, dek),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported algorithm', async () => {
      const payload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(payload, dek);

      // Unsupported algorithm
      const invalidEncrypted = {
        ...encrypted,
        algorithm: 'unsupported-algorithm' as any,
      };

      await expect(
        service.decryptPayload(invalidEncrypted, dek),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('encryptVaultWithPassword', () => {
    it('should encrypt vault with password', async () => {
      const payload = createTestVaultPayload();
      const password = 'test-password';
      const salt = await dekService.generateSalt();

      const result = await service.encryptVaultWithPassword(
        payload,
        password,
        salt,
      );

      expect(result).toHaveProperty('encryptedPayload');
      expect(result).toHaveProperty('wrappedDEK');
      expect(result.encryptedPayload).toHaveProperty('encryptedData');
      expect(result.wrappedDEK).toHaveProperty('encryptedDEK');
      expect(result.wrappedDEK).toHaveProperty('nonce');
      expect(result.wrappedDEK).toHaveProperty('tag');
    });

    it('should use AAD for DEK wrapping', async () => {
      const payload = createTestVaultPayload();
      const password = 'test-password';
      const salt = await dekService.generateSalt();
      const aad = 'test-vault-id';

      const result = await service.encryptVaultWithPassword(
        payload,
        password,
        salt,
        { aad },
      );

      expect(result).toHaveProperty('encryptedPayload');
      expect(result).toHaveProperty('wrappedDEK');
    });
  });

  describe('decryptVaultWithPassword', () => {
    it('should decrypt vault with password', async () => {
      const originalPayload = createTestVaultPayload();
      const password = 'test-password';
      const salt = await dekService.generateSalt();

      const { encryptedPayload, wrappedDEK } =
        await service.encryptVaultWithPassword(originalPayload, password, salt);

      const result = await service.decryptVaultWithPassword(
        encryptedPayload,
        wrappedDEK,
        password,
        salt,
      );

      expect(result.payload).toEqual(originalPayload);
    });

    it('should fail with wrong password', async () => {
      const payload = createTestVaultPayload();
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';
      const salt = await dekService.generateSalt();

      const { encryptedPayload, wrappedDEK } =
        await service.encryptVaultWithPassword(payload, correctPassword, salt);

      await expect(
        service.decryptVaultWithPassword(
          encryptedPayload,
          wrappedDEK,
          wrongPassword,
          salt,
        ),
      ).rejects.toThrow();
    });
  });

  describe('reencryptPayload', () => {
    it('should re-encrypt payload with new DEK', async () => {
      const originalPayload = createTestVaultPayload();
      const oldDEK = await generateTestDEK();
      const newDEK = await generateTestDEK();

      const oldEncrypted = await service.encryptPayload(
        originalPayload,
        oldDEK,
      );
      const newEncrypted = await service.reencryptPayload(
        oldEncrypted,
        oldDEK,
        newDEK,
      );

      // Should be able to decrypt with new DEK
      const result = await service.decryptPayload(newEncrypted, newDEK);
      expect(result.payload).toEqual(originalPayload);

      // Should not be able to decrypt with old DEK
      await expect(
        service.decryptPayload(newEncrypted, oldDEK),
      ).rejects.toThrow();
    });

    it('should preserve compression settings during re-encryption', async () => {
      const payload = createLargeTestVaultPayload();
      const oldDEK = await generateTestDEK();
      const newDEK = await generateTestDEK();

      const oldEncrypted = await service.encryptPayload(payload, oldDEK, {
        compress: true,
      });
      expect(oldEncrypted.compressed).toBe(true);

      const newEncrypted = await service.reencryptPayload(
        oldEncrypted,
        oldDEK,
        newDEK,
        { compress: true },
      );
      expect(newEncrypted.compressed).toBe(true);

      const result = await service.decryptPayload(newEncrypted, newDEK);
      expect(result.payload).toEqual(payload);
    });
  });

  describe('getEncryptionStats', () => {
    it('should return correct encryption statistics', async () => {
      const payload = createTestVaultPayload();
      const dek = await generateTestDEK();

      const encrypted = await service.encryptPayload(payload, dek);
      const stats = service.getEncryptionStats(encrypted);

      expect(stats).toHaveProperty('encryptedSize');
      expect(stats).toHaveProperty('algorithm', 'xchacha20-poly1305');
      expect(stats).toHaveProperty('version', 1);
      expect(stats).toHaveProperty('compressed');
      expect(stats).toHaveProperty('createdAt');

      expect(typeof stats.encryptedSize).toBe('number');
      expect(stats.encryptedSize).toBeGreaterThan(0);
    });
  });

  // Helper functions
  function createTestVaultPayload(): VaultPayload {
    const now = new Date();
    return {
      entries: [
        {
          id: 'entry-1',
          title: 'Test Entry 1',
          description: 'This is a test entry',
          status: 'todo',
          priority: 'medium',
          tags: ['test', 'demo'],
          assignedTo: 'user-1',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'entry-2',
          title: 'Test Entry 2',
          status: 'in-progress',
          priority: 'high',
          createdAt: now,
          updatedAt: now,
        },
      ],
      boards: [
        {
          id: 'board-1',
          name: 'Test Board',
          description: 'A test kanban board',
          columns: ['todo', 'in-progress', 'done'],
          settings: {
            color: '#blue',
            archived: false,
            starred: true,
          },
          createdAt: now,
          updatedAt: now,
        },
      ],
      metadata: {
        version: '1.0.0',
        lastSyncAt: now,
        entryCount: 2,
        boardCount: 1,
        checksum: 'test-checksum',
        syncId: 'sync-123',
      },
    };
  }

  function createLargeTestVaultPayload(): VaultPayload {
    const basePayload = createTestVaultPayload();

    // Create many entries to make payload large enough for meaningful compression
    const largeEntries: VaultEntry[] = [];
    for (let i = 0; i < 100; i++) {
      largeEntries.push({
        id: `entry-${i}`,
        title: `Test Entry ${i}`,
        description:
          `This is a very long description for test entry ${i}. `.repeat(10),
        status: i % 3 === 0 ? 'todo' : i % 3 === 1 ? 'in-progress' : 'done',
        priority: i % 3 === 0 ? 'low' : i % 3 === 1 ? 'medium' : 'high',
        tags: [`tag-${i}`, `category-${i % 5}`],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return {
      ...basePayload,
      entries: largeEntries,
      metadata: {
        ...basePayload.metadata,
        entryCount: largeEntries.length,
      },
    };
  }

  async function generateTestDEK(): Promise<Uint8Array> {
    const dekResult = await dekService.generateDEK();
    return dekResult.dek;
  }
});
