import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RecoveryCodeService } from '../recovery-code.service';
import * as sodium from 'libsodium-wrappers';

describe('RecoveryCodeService', () => {
  let service: RecoveryCodeService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecoveryCodeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test'),
          },
        },
      ],
    }).compile();

    service = module.get<RecoveryCodeService>(RecoveryCodeService);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize sodium before tests
    await sodium.ready;
  });

  describe('generateRecoveryCode', () => {
    it('should generate a valid recovery code', async () => {
      const result = await service.generateRecoveryCode();

      expect(result).toBeDefined();
      expect(result.code).toMatch(
        /^[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}$/,
      );
      expect(result.rawCode).toMatch(/^[A-Z2-7]{32}$/);
      expect(result.salt).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.version).toBe(1);
    });

    it('should generate unique recovery codes', async () => {
      const result1 = await service.generateRecoveryCode();
      const result2 = await service.generateRecoveryCode();

      expect(result1.code).not.toBe(result2.code);
      expect(result1.rawCode).not.toBe(result2.rawCode);
      expect(result1.salt).not.toBe(result2.salt);
    });
  });

  describe('deriveRecoveryKey', () => {
    it('should derive recovery key from recovery code', async () => {
      const recoveryCode = await service.generateRecoveryCode();

      const recoveryKey = await service.deriveRecoveryKey(
        recoveryCode.code,
        recoveryCode.salt,
      );

      expect(recoveryKey).toBeInstanceOf(Uint8Array);
      expect(recoveryKey.length).toBe(32); // 256 bits
    });

    it('should derive the same key for the same recovery code and salt', async () => {
      const recoveryCode = await service.generateRecoveryCode();

      const recoveryKey1 = await service.deriveRecoveryKey(
        recoveryCode.code,
        recoveryCode.salt,
      );

      const recoveryKey2 = await service.deriveRecoveryKey(
        recoveryCode.code,
        recoveryCode.salt,
      );

      expect(recoveryKey1).toEqual(recoveryKey2);
    });

    it('should derive different keys for different recovery codes', async () => {
      const recoveryCode1 = await service.generateRecoveryCode();
      const recoveryCode2 = await service.generateRecoveryCode();

      const recoveryKey1 = await service.deriveRecoveryKey(
        recoveryCode1.code,
        recoveryCode1.salt,
      );

      const recoveryKey2 = await service.deriveRecoveryKey(
        recoveryCode2.code,
        recoveryCode2.salt,
      );

      expect(recoveryKey1).not.toEqual(recoveryKey2);
    });

    it('should reject invalid recovery code formats', async () => {
      const validCode = await service.generateRecoveryCode();

      await expect(
        service.deriveRecoveryKey('invalid', validCode.salt),
      ).rejects.toThrow('Recovery key derivation failed');

      await expect(
        service.deriveRecoveryKey('XXXX-XXXX-XXXX-XXX1', validCode.salt),
      ).rejects.toThrow('Recovery key derivation failed');
    });
  });

  describe('wrapDEKWithRecoveryKey', () => {
    it('should wrap DEK with recovery key', async () => {
      const dek = sodium.randombytes_buf(32); // 256-bit DEK
      const recoveryKey = sodium.randombytes_buf(32); // 256-bit recovery key

      const wrappedDEK = await service.wrapDEKWithRecoveryKey(dek, recoveryKey);

      expect(wrappedDEK).toBeDefined();
      expect(wrappedDEK.encryptedDEK).toBeDefined();
      expect(wrappedDEK.nonce).toBeDefined();
      expect(wrappedDEK.tag).toBeDefined();
      expect(wrappedDEK.metadata.algorithm).toBe('xchacha20-poly1305');
      expect(wrappedDEK.metadata.purpose).toBe('recovery');
      expect(wrappedDEK.metadata.version).toBe(1);
    });

    it('should produce different wrapped DEKs for the same DEK', async () => {
      const dek = sodium.randombytes_buf(32);
      const recoveryKey = sodium.randombytes_buf(32);

      const wrappedDEK1 = await service.wrapDEKWithRecoveryKey(
        dek,
        recoveryKey,
      );
      const wrappedDEK2 = await service.wrapDEKWithRecoveryKey(
        dek,
        recoveryKey,
      );

      // Should have different nonces and therefore different ciphertexts
      expect(wrappedDEK1.nonce).not.toBe(wrappedDEK2.nonce);
      expect(wrappedDEK1.encryptedDEK).not.toBe(wrappedDEK2.encryptedDEK);
    });
  });

  describe('unwrapDEKWithRecoveryKey', () => {
    it('should unwrap DEK with correct recovery key', async () => {
      const originalDEK = sodium.randombytes_buf(32);
      const recoveryKey = sodium.randombytes_buf(32);

      const wrappedDEK = await service.wrapDEKWithRecoveryKey(
        originalDEK,
        recoveryKey,
      );
      const result = await service.unwrapDEKWithRecoveryKey(
        wrappedDEK,
        recoveryKey,
      );

      expect(result.success).toBe(true);
      expect(result.dek).toEqual(originalDEK);
    });

    it('should fail to unwrap DEK with wrong recovery key', async () => {
      const originalDEK = sodium.randombytes_buf(32);
      const recoveryKey = sodium.randombytes_buf(32);
      const wrongRecoveryKey = sodium.randombytes_buf(32);

      const wrappedDEK = await service.wrapDEKWithRecoveryKey(
        originalDEK,
        recoveryKey,
      );
      const result = await service.unwrapDEKWithRecoveryKey(
        wrappedDEK,
        wrongRecoveryKey,
      );

      expect(result.success).toBe(false);
      expect(result.dek.length).toBe(0);
    });

    it('should fail to unwrap corrupted wrapped DEK', async () => {
      const originalDEK = sodium.randombytes_buf(32);
      const recoveryKey = sodium.randombytes_buf(32);

      const wrappedDEK = await service.wrapDEKWithRecoveryKey(
        originalDEK,
        recoveryKey,
      );

      // Corrupt the wrapped DEK
      const corruptedWrappedDEK = {
        ...wrappedDEK,
        encryptedDEK: Buffer.from(sodium.randombytes_buf(32)).toString(
          'base64',
        ),
      };

      const result = await service.unwrapDEKWithRecoveryKey(
        corruptedWrappedDEK,
        recoveryKey,
      );

      expect(result.success).toBe(false);
    });
  });

  describe('generateRecoveryCodeForDEK', () => {
    it('should generate complete recovery code system for DEK', async () => {
      const dek = sodium.randombytes_buf(32);

      const result = await service.generateRecoveryCodeForDEK(dek);

      expect(result).toBeDefined();
      expect(result.recoveryCode).toBeDefined();
      expect(result.wrappedDEK).toBeDefined();
      expect(result.instructions).toBeInstanceOf(Array);
      expect(result.instructions.length).toBeGreaterThan(0);

      // Verify the recovery code can unwrap the DEK
      const recoveryKey = await service.deriveRecoveryKey(
        result.recoveryCode.code,
        result.recoveryCode.salt,
      );

      const unwrapResult = await service.unwrapDEKWithRecoveryKey(
        result.wrappedDEK,
        recoveryKey,
      );

      expect(unwrapResult.success).toBe(true);
      expect(unwrapResult.dek).toEqual(dek);
    });
  });

  describe('validateRecoveryCode', () => {
    it('should validate correct recovery code', async () => {
      const recoveryCode = await service.generateRecoveryCode();

      const result = await service.validateRecoveryCode(
        recoveryCode.code,
        recoveryCode.salt,
      );

      expect(result.valid).toBe(true);
      expect(result.key).toBeInstanceOf(Uint8Array);
      expect(result.key!.length).toBe(32);
    });

    it('should reject invalid recovery code', async () => {
      const validCode = await service.generateRecoveryCode();

      const result = await service.validateRecoveryCode(
        'INVALID-CODE-FORMAT-XXXX',
        validCode.salt,
      );

      expect(result.valid).toBe(false);
      expect(result.key).toBeUndefined();
    });

    it('should reject recovery code with invalid salt', async () => {
      const validCode = await service.generateRecoveryCode();

      const result = await service.validateRecoveryCode(
        validCode.code,
        'invalid-salt',
      );

      expect(result.valid).toBe(false);
      expect(result.key).toBeUndefined();
    });
  });

  describe('complete recovery workflow', () => {
    it('should successfully complete full recovery workflow', async () => {
      // Step 1: Generate original DEK
      const originalDEK = sodium.randombytes_buf(32);

      // Step 2: Generate recovery code system
      const recoverySystem =
        await service.generateRecoveryCodeForDEK(originalDEK);

      // Step 3: Validate recovery code (as user would enter it)
      const validation = await service.validateRecoveryCode(
        recoverySystem.recoveryCode.code,
        recoverySystem.recoveryCode.salt,
      );
      expect(validation.valid).toBe(true);

      // Step 4: Derive recovery key
      const recoveryKey = await service.deriveRecoveryKey(
        recoverySystem.recoveryCode.code,
        recoverySystem.recoveryCode.salt,
      );

      // Step 5: Unwrap DEK using recovery key
      const unwrapResult = await service.unwrapDEKWithRecoveryKey(
        recoverySystem.wrappedDEK,
        recoveryKey,
      );

      expect(unwrapResult.success).toBe(true);
      expect(unwrapResult.dek).toEqual(originalDEK);
    });

    it('should fail recovery workflow with wrong recovery code', async () => {
      // Generate two different recovery systems
      const originalDEK = sodium.randombytes_buf(32);
      const recoverySystem1 =
        await service.generateRecoveryCodeForDEK(originalDEK);
      const recoverySystem2 =
        await service.generateRecoveryCodeForDEK(originalDEK);

      // Try to use recovery code from system2 to unwrap DEK from system1
      const recoveryKey = await service.deriveRecoveryKey(
        recoverySystem2.recoveryCode.code,
        recoverySystem2.recoveryCode.salt,
      );

      const unwrapResult = await service.unwrapDEKWithRecoveryKey(
        recoverySystem1.wrappedDEK,
        recoveryKey,
      );

      expect(unwrapResult.success).toBe(false);
    });
  });

  describe('security properties', () => {
    it('should generate cryptographically secure recovery codes', async () => {
      const codes = await Promise.all(
        Array(100)
          .fill(null)
          .map(() => service.generateRecoveryCode()),
      );

      const uniqueCodes = new Set(codes.map((c) => c.code));
      expect(uniqueCodes.size).toBe(100); // All codes should be unique

      // Check that codes don't follow predictable patterns
      const sortedCodes = codes.map((c) => c.code).sort();
      for (let i = 1; i < sortedCodes.length; i++) {
        expect(sortedCodes[i]).not.toBe(sortedCodes[i - 1]);
      }
    });

    it('should use proper base32 encoding for recovery codes', async () => {
      const recoveryCode = await service.generateRecoveryCode();

      // Base32 should not contain 0, 1, 8, 9 to avoid confusion
      expect(recoveryCode.rawCode).not.toMatch(/[0189]/);

      // Should only contain valid Base32 characters
      expect(recoveryCode.rawCode).toMatch(/^[A-Z2-7]+$/);
    });

    it('should use unique salts for each recovery code', async () => {
      const codes = await Promise.all(
        Array(10)
          .fill(null)
          .map(() => service.generateRecoveryCode()),
      );

      const uniqueSalts = new Set(codes.map((c) => c.salt));
      expect(uniqueSalts.size).toBe(10); // All salts should be unique
    });

    it('should properly format recovery codes with hyphens', async () => {
      const recoveryCode = await service.generateRecoveryCode();

      expect(recoveryCode.code).toMatch(
        /^[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{8}$/,
      );
      expect(recoveryCode.rawCode.length).toBe(32);
      expect(recoveryCode.code.replace(/-/g, '')).toBe(recoveryCode.rawCode);
    });
  });
});
