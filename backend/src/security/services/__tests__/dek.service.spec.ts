import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DEKService } from '../dek.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('DEKService', () => {
  let service: DEKService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DEKService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
      ],
    }).compile();

    service = module.get<DEKService>(DEKService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDEK', () => {
    it('should generate a 256-bit DEK', async () => {
      const result = await service.generateDEK();

      expect(result.dek).toBeInstanceOf(Uint8Array);
      expect(result.dek.length).toBe(32); // 256 bits = 32 bytes
      expect(result.metadata.version).toBe(1);
      expect(result.metadata.algorithm).toBe('xchacha20-poly1305');
      expect(result.metadata.createdAt).toBeInstanceOf(Date);
    });

    it('should generate DEK with custom version', async () => {
      const result = await service.generateDEK({ version: 2 });

      expect(result.metadata.version).toBe(2);
    });

    it('should generate different DEKs on each call', async () => {
      const result1 = await service.generateDEK();
      const result2 = await service.generateDEK();

      expect(result1.dek).not.toEqual(result2.dek);
    });
  });

  describe('wrapDEK', () => {
    let testDEK: Uint8Array;
    let testMasterKey: Uint8Array;

    beforeEach(async () => {
      const dekResult = await service.generateDEK();
      testDEK = dekResult.dek;
      testMasterKey = await service.generateMasterKey();
    });

    afterEach(() => {
      service.clearMemory([testDEK, testMasterKey]);
    });

    it('should wrap a DEK successfully', async () => {
      const wrapped = await service.wrapDEK(testDEK, testMasterKey);

      expect(wrapped.encryptedDEK).toBeDefined();
      expect(wrapped.nonce).toBeDefined();
      expect(wrapped.tag).toBeDefined();
      expect(wrapped.metadata.version).toBe(1);
      expect(wrapped.metadata.algorithm).toBe('xchacha20-poly1305');
      
      // Verify base64 encoding
      expect(() => Buffer.from(wrapped.encryptedDEK, 'base64')).not.toThrow();
      expect(() => Buffer.from(wrapped.nonce, 'base64')).not.toThrow();
      expect(() => Buffer.from(wrapped.tag, 'base64')).not.toThrow();
    });

    it('should produce different wrapped DEKs for the same input', async () => {
      const wrapped1 = await service.wrapDEK(testDEK, testMasterKey);
      const wrapped2 = await service.wrapDEK(testDEK, testMasterKey);

      // Different nonces should produce different results
      expect(wrapped1.nonce).not.toBe(wrapped2.nonce);
      expect(wrapped1.encryptedDEK).not.toBe(wrapped2.encryptedDEK);
    });

    it('should accept custom nonce', async () => {
      const customNonce = new Uint8Array(24);
      customNonce.fill(42);

      const wrapped = await service.wrapDEK(testDEK, testMasterKey, {
        nonce: customNonce,
      });

      const expectedNonce = Buffer.from(customNonce).toString('base64');
      expect(wrapped.nonce).toBe(expectedNonce);
    });

    it('should include AAD when provided', async () => {
      const aad = 'test-aad';
      const wrapped = await service.wrapDEK(testDEK, testMasterKey, { aad });

      // Should wrap successfully with AAD
      expect(wrapped.encryptedDEK).toBeDefined();
    });

    it('should throw error for invalid DEK size', async () => {
      const invalidDEK = new Uint8Array(16); // Wrong size

      await expect(
        service.wrapDEK(invalidDEK, testMasterKey),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for invalid master key size', async () => {
      const invalidMasterKey = new Uint8Array(16); // Wrong size

      await expect(
        service.wrapDEK(testDEK, invalidMasterKey),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for invalid nonce size', async () => {
      const invalidNonce = new Uint8Array(16); // Wrong size

      await expect(
        service.wrapDEK(testDEK, testMasterKey, { nonce: invalidNonce }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unwrapDEK', () => {
    let testDEK: Uint8Array;
    let testMasterKey: Uint8Array;
    let wrappedDEK: any;

    beforeEach(async () => {
      const dekResult = await service.generateDEK();
      testDEK = dekResult.dek;
      testMasterKey = await service.generateMasterKey();
      wrappedDEK = await service.wrapDEK(testDEK, testMasterKey);
    });

    afterEach(() => {
      service.clearMemory([testDEK, testMasterKey]);
    });

    it('should unwrap a DEK successfully', async () => {
      const result = await service.unwrapDEK(wrappedDEK, testMasterKey);

      expect(result.dek).toEqual(testDEK);
      expect(result.metadata.version).toBe(wrappedDEK.metadata.version);
      expect(result.metadata.algorithm).toBe('xchacha20-poly1305');
    });

    it('should unwrap DEK with matching AAD', async () => {
      const aad = 'test-aad';
      const wrappedWithAAD = await service.wrapDEK(testDEK, testMasterKey, { aad });
      
      const result = await service.unwrapDEK(wrappedWithAAD, testMasterKey, { aad });
      
      expect(result.dek).toEqual(testDEK);
    });

    it('should fail with wrong master key', async () => {
      const wrongMasterKey = await service.generateMasterKey();

      await expect(
        service.unwrapDEK(wrappedDEK, wrongMasterKey),
      ).rejects.toThrow(BadRequestException);

      service.clearMemory(wrongMasterKey);
    });

    it('should fail with wrong AAD', async () => {
      const aad = 'test-aad';
      const wrappedWithAAD = await service.wrapDEK(testDEK, testMasterKey, { aad });

      await expect(
        service.unwrapDEK(wrappedWithAAD, testMasterKey, { aad: 'wrong-aad' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail with corrupted encrypted data', async () => {
      const corruptedWrapped = {
        ...wrappedDEK,
        encryptedDEK: 'corrupted-data',
      };

      await expect(
        service.unwrapDEK(corruptedWrapped, testMasterKey),
      ).rejects.toThrow();
    });

    it('should fail with invalid nonce size', async () => {
      const invalidWrapped = {
        ...wrappedDEK,
        nonce: Buffer.from(new Uint8Array(16)).toString('base64'), // Wrong size
      };

      await expect(
        service.unwrapDEK(invalidWrapped, testMasterKey),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getKeyRotationInfo', () => {
    it('should return correct info for empty array', () => {
      const info = service.getKeyRotationInfo([]);

      expect(info.currentVersion).toBe(1);
      expect(info.availableVersions).toEqual([]);
      expect(info.rotationNeeded).toBe(false);
    });

    it('should return correct info for single DEK', async () => {
      const dek = await service.generateDEK();
      const masterKey = await service.generateMasterKey();
      const wrapped = await service.wrapDEK(dek.dek, masterKey);

      const info = service.getKeyRotationInfo([wrapped]);

      expect(info.currentVersion).toBe(1);
      expect(info.availableVersions).toEqual([1]);
      expect(info.rotationNeeded).toBe(false);

      service.clearMemory([dek.dek, masterKey]);
    });

    it('should detect rotation needed for old versions', async () => {
      const oldVersionDEK = await service.generateDEK({ version: 0 });
      const masterKey = await service.generateMasterKey();
      const wrapped = await service.wrapDEK(oldVersionDEK.dek, masterKey, { version: 0 });

      const info = service.getKeyRotationInfo([wrapped]);

      expect(info.currentVersion).toBe(1);
      expect(info.availableVersions).toEqual([0]);
      expect(info.rotationNeeded).toBe(true);

      service.clearMemory([oldVersionDEK.dek, masterKey]);
    });
  });

  describe('rotateDEK', () => {
    let testDEK: Uint8Array;
    let oldMasterKey: Uint8Array;
    let newMasterKey: Uint8Array;
    let wrappedDEK: any;

    beforeEach(async () => {
      const dekResult = await service.generateDEK();
      testDEK = dekResult.dek;
      oldMasterKey = await service.generateMasterKey();
      newMasterKey = await service.generateMasterKey();
      wrappedDEK = await service.wrapDEK(testDEK, oldMasterKey);
    });

    afterEach(() => {
      service.clearMemory([testDEK, oldMasterKey, newMasterKey]);
    });

    it('should rotate DEK successfully', async () => {
      const rotated = await service.rotateDEK(
        wrappedDEK,
        oldMasterKey,
        newMasterKey,
        2,
      );

      expect(rotated.metadata.version).toBe(2);
      expect(rotated.encryptedDEK).not.toBe(wrappedDEK.encryptedDEK);

      // Verify the rotated DEK can be unwrapped with new master key
      const unwrapped = await service.unwrapDEK(rotated, newMasterKey);
      expect(unwrapped.dek).toEqual(testDEK);

      service.clearMemory(unwrapped.dek);
    });

    it('should fail with wrong old master key', async () => {
      const wrongOldKey = await service.generateMasterKey();

      await expect(
        service.rotateDEK(wrappedDEK, wrongOldKey, newMasterKey),
      ).rejects.toThrow(InternalServerErrorException);

      service.clearMemory(wrongOldKey);
    });
  });

  describe('memory management', () => {
    it('should clear memory properly', () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const originalData = new Uint8Array(testData);

      service.clearMemory(testData);

      expect(testData).not.toEqual(originalData);
      expect(testData.every(byte => byte === 0)).toBe(true);
    });

    it('should clear multiple arrays', () => {
      const testData1 = new Uint8Array([1, 2, 3]);
      const testData2 = new Uint8Array([4, 5, 6]);

      service.clearMemory([testData1, testData2]);

      expect(testData1.every(byte => byte === 0)).toBe(true);
      expect(testData2.every(byte => byte === 0)).toBe(true);
    });

    it('should handle empty arrays gracefully', () => {
      expect(() => service.clearMemory(new Uint8Array(0))).not.toThrow();
      expect(() => service.clearMemory([])).not.toThrow();
    });
  });

  describe('master key operations', () => {
    it('should generate master key of correct size', async () => {
      const masterKey = await service.generateMasterKey();

      expect(masterKey).toBeInstanceOf(Uint8Array);
      expect(masterKey.length).toBe(32);

      service.clearMemory(masterKey);
    });

    it('should derive master key from password', async () => {
      const password = 'test-password-123';
      const salt = await service.generateSalt();

      const masterKey = await service.deriveMasterKey(password, salt);

      expect(masterKey).toBeInstanceOf(Uint8Array);
      expect(masterKey.length).toBe(32);

      // Same password and salt should produce same key
      const masterKey2 = await service.deriveMasterKey(password, salt);
      expect(masterKey).toEqual(masterKey2);

      service.clearMemory([masterKey, masterKey2, salt]);
    });

    it('should generate salt of correct size', async () => {
      const salt = await service.generateSalt();

      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32); // crypto_pwhash_SALTBYTES

      service.clearMemory(salt);
    });
  });
});