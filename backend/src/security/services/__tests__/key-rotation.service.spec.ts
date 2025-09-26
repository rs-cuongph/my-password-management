import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KeyRotationService, RotationPlan } from '../key-rotation.service';
import { DEKService } from '../dek.service';
import { WrappedDEK } from '../../interfaces/dek.interface';

describe('KeyRotationService', () => {
  let service: KeyRotationService;
  let dekService: DEKService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyRotationService,
        DEKService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
      ],
    }).compile();

    service = module.get<KeyRotationService>(KeyRotationService);
    dekService = module.get<DEKService>(DEKService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('version management', () => {
    it('should support version 1', () => {
      expect(service.isVersionSupported(1)).toBe(true);
    });

    it('should not support unsupported versions', () => {
      expect(service.isVersionSupported(999)).toBe(false);
    });

    it('should return latest version as 1', () => {
      expect(service.getLatestVersion()).toBe(1);
    });

    it('should return supported versions', () => {
      const versions = service.getSupportedVersions();
      expect(versions).toHaveLength(1);
      expect(versions[0].version).toBe(1);
      expect(versions[0].algorithm).toBe('xchacha20-poly1305');
      expect(versions[0].deprecated).toBe(false);
    });

    it('should identify deprecated versions correctly', () => {
      expect(service.isVersionDeprecated(1)).toBe(false);
      expect(service.isVersionDeprecated(999)).toBe(true); // Unknown versions are deprecated
    });
  });

  describe('analyzeRotationRequirements', () => {
    let testWrappedDEKs: WrappedDEK[];
    let masterKeys: Uint8Array[];

    beforeEach(async () => {
      // Create test DEKs with different versions and ages
      const dek1 = await dekService.generateDEK({ version: 1 });
      const dek2 = await dekService.generateDEK({ version: 0 }); // Old version

      const masterKey1 = await dekService.generateMasterKey();
      const masterKey2 = await dekService.generateMasterKey();
      masterKeys = [masterKey1, masterKey2];

      const wrapped1 = await dekService.wrapDEK(dek1.dek, masterKey1, {
        version: 1,
      });
      const wrapped2 = await dekService.wrapDEK(dek2.dek, masterKey2, {
        version: 0,
      });

      // Make the second DEK appear old
      wrapped2.metadata.createdAt = new Date(
        Date.now() - 400 * 24 * 60 * 60 * 1000,
      ); // 400 days ago

      testWrappedDEKs = [wrapped1, wrapped2];

      dekService.clearMemory([dek1.dek, dek2.dek]);
    });

    afterEach(() => {
      dekService.clearMemory(masterKeys);
    });

    it('should identify age-based rotation requirements', () => {
      const analysis = service.analyzeRotationRequirements(testWrappedDEKs, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      const ageBasedRecommendations = analysis.recommendations.filter(
        (r) => r.type === 'age-based',
      );
      expect(ageBasedRecommendations).toHaveLength(1);
      expect(ageBasedRecommendations[0].priority).toBe('high');
    });

    it('should identify version-based rotation requirements', () => {
      const analysis = service.analyzeRotationRequirements(testWrappedDEKs);

      const versionBasedRecommendations = analysis.recommendations.filter(
        (r) => r.type === 'version-based',
      );
      expect(versionBasedRecommendations).toHaveLength(1);
      expect(versionBasedRecommendations[0].wrappedDEK.metadata.version).toBe(
        0,
      );
      expect(versionBasedRecommendations[0].recommendedVersion).toBe(1);
    });

    it('should return correct rotation info', () => {
      const analysis = service.analyzeRotationRequirements(testWrappedDEKs);

      expect(analysis.rotationInfo.currentVersion).toBe(1);
      expect(analysis.rotationInfo.availableVersions).toEqual([1, 0]);
      expect(analysis.rotationInfo.rotationNeeded).toBe(true);
    });

    it('should handle empty DEK list', () => {
      const analysis = service.analyzeRotationRequirements([]);

      expect(analysis.recommendations).toHaveLength(0);
      expect(analysis.rotationInfo.rotationNeeded).toBe(false);
    });
  });

  describe('generateRotationPlan', () => {
    let testWrappedDEKs: WrappedDEK[];
    let masterKeyMapping: Map<number, Uint8Array>;

    beforeEach(async () => {
      // Create test DEKs that need rotation
      const dek1 = await dekService.generateDEK({ version: 0 });
      const dek2 = await dekService.generateDEK({ version: 0 });

      const oldMasterKey = await dekService.generateMasterKey();
      const newMasterKey = await dekService.generateMasterKey();

      const wrapped1 = await dekService.wrapDEK(dek1.dek, oldMasterKey, {
        version: 0,
      });
      const wrapped2 = await dekService.wrapDEK(dek2.dek, oldMasterKey, {
        version: 0,
      });

      testWrappedDEKs = [wrapped1, wrapped2];

      masterKeyMapping = new Map();
      masterKeyMapping.set(0, oldMasterKey);
      masterKeyMapping.set(1, newMasterKey);

      dekService.clearMemory([dek1.dek, dek2.dek]);
    });

    afterEach(() => {
      masterKeyMapping.forEach((key) => dekService.clearMemory(key));
    });

    it('should generate rotation plan successfully', () => {
      const plan = service.generateRotationPlan(
        testWrappedDEKs,
        masterKeyMapping,
      );

      expect(plan.totalDEKs).toBe(2);
      expect(plan.tasksRequired).toBe(2);
      expect(plan.tasks).toHaveLength(2);
      expect(plan.estimatedDuration).toBeGreaterThan(0);

      // All tasks should target version 1
      plan.tasks.forEach((task) => {
        expect(task.targetVersion).toBe(1);
        expect(task.wrappedDEK.metadata.version).toBe(0);
      });
    });

    it('should throw error if master key is missing', () => {
      const incompleteMasterKeyMapping = new Map();
      incompleteMasterKeyMapping.set(1, masterKeyMapping.get(1)!); // Missing key for version 0

      expect(() =>
        service.generateRotationPlan(
          testWrappedDEKs,
          incompleteMasterKeyMapping,
        ),
      ).toThrow('Master key for version 0 not provided');
    });

    it('should handle DEKs that do not need rotation', async () => {
      const currentDEK = await dekService.generateDEK({ version: 1 });
      const currentMasterKey = await dekService.generateMasterKey();
      const currentWrapped = await dekService.wrapDEK(
        currentDEK.dek,
        currentMasterKey,
        { version: 1 },
      );

      const currentMasterKeyMapping = new Map();
      currentMasterKeyMapping.set(1, currentMasterKey);

      const plan = service.generateRotationPlan(
        [currentWrapped],
        currentMasterKeyMapping,
      );

      expect(plan.totalDEKs).toBe(1);
      expect(plan.tasksRequired).toBe(0);
      expect(plan.tasks).toHaveLength(0);

      dekService.clearMemory([currentDEK.dek, currentMasterKey]);
    });
  });

  describe('validateRotationPlan', () => {
    let mockPlan: RotationPlan;

    beforeEach(() => {
      mockPlan = {
        totalDEKs: 2,
        tasksRequired: 2,
        highPriorityTasks: 1,
        tasks: [
          {
            wrappedDEK: {} as WrappedDEK,
            oldMasterKey: new Uint8Array(32),
            newMasterKey: new Uint8Array(32),
            targetVersion: 1,
            priority: 'critical',
            reason: 'Test reason',
          },
          {
            wrappedDEK: {} as WrappedDEK,
            oldMasterKey: new Uint8Array(32),
            newMasterKey: new Uint8Array(32),
            targetVersion: 1,
            priority: 'medium',
            reason: 'Test reason',
          },
        ],
        estimatedDuration: 200,
      };
    });

    it('should validate correct plan', () => {
      const validation = service.validateRotationPlan(mockPlan);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toContain(
        '1 critical priority tasks require immediate attention',
      );
    });

    it('should identify critical tasks in warnings', () => {
      const validation = service.validateRotationPlan(mockPlan);

      expect(validation.warnings).toContain(
        '1 critical priority tasks require immediate attention',
      );
    });

    it('should return required versions', () => {
      // Mock the wrapped DEKs to have specific versions
      mockPlan.tasks[0].wrappedDEK = { metadata: { version: 0 } } as WrappedDEK;
      mockPlan.tasks[1].wrappedDEK = { metadata: { version: 0 } } as WrappedDEK;

      const validation = service.validateRotationPlan(mockPlan);

      expect(validation.requiredVersions).toContain(0);
      expect(validation.requiredVersions).toContain(1);
    });
  });

  describe('bulkRotateDEKs', () => {
    it('should handle successful rotations', async () => {
      // Create a simple test case
      const dek = await dekService.generateDEK();
      const oldMasterKey = await dekService.generateMasterKey();
      const newMasterKey = await dekService.generateMasterKey();
      const wrapped = await dekService.wrapDEK(dek.dek, oldMasterKey);

      const tasks = [
        {
          wrappedDEK: wrapped,
          oldMasterKey,
          newMasterKey,
          targetVersion: 1,
          priority: 'medium' as const,
          reason: 'Test rotation',
        },
      ];

      const results = await service.bulkRotateDEKs(tasks);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].originalVersion).toBe(wrapped.metadata.version);
      expect(results[0].newVersion).toBe(1);
      expect(results[0].wrappedDEK).toBeDefined();

      dekService.clearMemory([dek.dek, oldMasterKey, newMasterKey]);
    });

    it('should handle failed rotations', async () => {
      const invalidTask = {
        wrappedDEK: {
          encryptedDEK: 'invalid',
          nonce: 'invalid',
          tag: 'invalid',
          metadata: {
            version: 0,
            createdAt: new Date(),
            algorithm: 'xchacha20-poly1305' as const,
          },
        },
        oldMasterKey: new Uint8Array(32),
        newMasterKey: new Uint8Array(32),
        targetVersion: 1,
        priority: 'medium' as const,
        reason: 'Test rotation',
      };

      const results = await service.bulkRotateDEKs([invalidTask]);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });
  });
});
