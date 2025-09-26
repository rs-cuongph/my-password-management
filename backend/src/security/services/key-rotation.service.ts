import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEKService } from './dek.service';
import { WrappedDEK, KeyRotationInfo } from '../interfaces/dek.interface';

export interface KeyVersionConfig {
  version: number;
  algorithm: 'xchacha20-poly1305';
  deprecated: boolean;
  expiresAt?: Date;
}

export interface RotationPolicy {
  maxAge: number; // milliseconds
  maxVersion: number;
  forceRotation: boolean;
}

@Injectable()
export class KeyRotationService {
  private readonly supportedVersions: Map<number, KeyVersionConfig> = new Map();
  private readonly defaultRotationPolicy: RotationPolicy;

  constructor(
    private dekService: DEKService,
    private configService: ConfigService,
  ) {
    this.initializeVersions();
    this.defaultRotationPolicy = {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      maxVersion: 1,
      forceRotation: false,
    };
  }

  private initializeVersions(): void {
    // Version 1: Current implementation with XChaCha20-Poly1305
    this.supportedVersions.set(1, {
      version: 1,
      algorithm: 'xchacha20-poly1305',
      deprecated: false,
    });

    // Future versions can be added here
    // Example:
    // this.supportedVersions.set(2, {
    //   version: 2,
    //   algorithm: 'xchacha20-poly1305',
    //   deprecated: false,
    // });
  }

  /**
   * Check if a key version is supported
   */
  isVersionSupported(version: number): boolean {
    return this.supportedVersions.has(version);
  }

  /**
   * Get supported versions
   */
  getSupportedVersions(): KeyVersionConfig[] {
    return Array.from(this.supportedVersions.values());
  }

  /**
   * Get the latest version
   */
  getLatestVersion(): number {
    const versions = Array.from(this.supportedVersions.keys());
    return Math.max(...versions);
  }

  /**
   * Check if a version is deprecated
   */
  isVersionDeprecated(version: number): boolean {
    const config = this.supportedVersions.get(version);
    return config ? config.deprecated : true;
  }

  /**
   * Analyze rotation requirements for a collection of wrapped DEKs
   */
  analyzeRotationRequirements(
    wrappedDEKs: WrappedDEK[],
    policy?: Partial<RotationPolicy>,
  ): {
    rotationInfo: KeyRotationInfo;
    recommendations: RotationRecommendation[];
  } {
    const effectivePolicy = { ...this.defaultRotationPolicy, ...policy };
    const now = new Date();
    const latestVersion = this.getLatestVersion();

    const recommendations: RotationRecommendation[] = [];

    for (const wrappedDEK of wrappedDEKs) {
      const age = now.getTime() - wrappedDEK.metadata.createdAt.getTime();
      const version = wrappedDEK.metadata.version;

      // Check age-based rotation
      if (age > effectivePolicy.maxAge) {
        recommendations.push({
          type: 'age-based',
          priority: 'high',
          reason: `Key is ${Math.floor(age / (24 * 60 * 60 * 1000))} days old, exceeds max age`,
          wrappedDEK,
          recommendedVersion: latestVersion,
        });
      }

      // Check version-based rotation
      if (version < latestVersion) {
        recommendations.push({
          type: 'version-based',
          priority: this.isVersionDeprecated(version) ? 'critical' : 'medium',
          reason: `Key version ${version} is outdated, latest is ${latestVersion}`,
          wrappedDEK,
          recommendedVersion: latestVersion,
        });
      }

      // Check deprecated versions
      if (this.isVersionDeprecated(version)) {
        recommendations.push({
          type: 'deprecation',
          priority: 'critical',
          reason: `Key version ${version} is deprecated`,
          wrappedDEK,
          recommendedVersion: latestVersion,
        });
      }
    }

    const rotationInfo = this.dekService.getKeyRotationInfo(wrappedDEKs);

    return {
      rotationInfo,
      recommendations,
    };
  }

  /**
   * Perform bulk rotation of DEKs
   */
  async bulkRotateDEKs(
    rotationTasks: RotationTask[],
  ): Promise<RotationResult[]> {
    const results: RotationResult[] = [];

    for (const task of rotationTasks) {
      try {
        const rotatedDEK = await this.dekService.rotateDEK(
          task.wrappedDEK,
          task.oldMasterKey,
          task.newMasterKey,
          task.targetVersion,
        );

        results.push({
          success: true,
          originalVersion: task.wrappedDEK.metadata.version,
          newVersion: rotatedDEK.metadata.version,
          wrappedDEK: rotatedDEK,
        });
      } catch (error) {
        results.push({
          success: false,
          originalVersion: task.wrappedDEK.metadata.version,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Generate a rotation plan for a collection of DEKs
   */
  generateRotationPlan(
    wrappedDEKs: WrappedDEK[],
    masterKeyMapping: Map<number, Uint8Array>,
    policy?: Partial<RotationPolicy>,
  ): RotationPlan {
    const analysis = this.analyzeRotationRequirements(wrappedDEKs, policy);
    const latestVersion = this.getLatestVersion();
    const newMasterKey = masterKeyMapping.get(latestVersion);

    if (!newMasterKey) {
      throw new BadRequestException(
        `Master key for version ${latestVersion} not provided`,
      );
    }

    const tasks: RotationTask[] = [];

    for (const recommendation of analysis.recommendations) {
      const oldVersion = recommendation.wrappedDEK.metadata.version;
      const oldMasterKey = masterKeyMapping.get(oldVersion);

      if (!oldMasterKey) {
        throw new BadRequestException(
          `Master key for version ${oldVersion} not provided`,
        );
      }

      tasks.push({
        wrappedDEK: recommendation.wrappedDEK,
        oldMasterKey,
        newMasterKey,
        targetVersion: recommendation.recommendedVersion,
        priority: recommendation.priority,
        reason: recommendation.reason,
      });
    }

    return {
      totalDEKs: wrappedDEKs.length,
      tasksRequired: tasks.length,
      highPriorityTasks: tasks.filter(
        (t) => t.priority === 'high' || t.priority === 'critical',
      ).length,
      tasks,
      estimatedDuration: tasks.length * 100, // rough estimate in ms
    };
  }

  /**
   * Validate rotation plan before execution
   */
  validateRotationPlan(plan: RotationPlan): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for missing master keys
    const requiredVersions = new Set<number>();
    for (const task of plan.tasks) {
      requiredVersions.add(task.wrappedDEK.metadata.version);
      requiredVersions.add(task.targetVersion);
    }

    // Check for deprecated target versions
    for (const task of plan.tasks) {
      if (this.isVersionDeprecated(task.targetVersion)) {
        warnings.push(`Task targets deprecated version ${task.targetVersion}`);
      }
    }

    // Check for high-priority tasks
    const criticalTasks = plan.tasks.filter((t) => t.priority === 'critical');
    if (criticalTasks.length > 0) {
      warnings.push(
        `${criticalTasks.length} critical priority tasks require immediate attention`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      requiredVersions: Array.from(requiredVersions),
    };
  }
}

export interface RotationRecommendation {
  type: 'age-based' | 'version-based' | 'deprecation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  wrappedDEK: WrappedDEK;
  recommendedVersion: number;
}

export interface RotationTask {
  wrappedDEK: WrappedDEK;
  oldMasterKey: Uint8Array;
  newMasterKey: Uint8Array;
  targetVersion: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export interface RotationResult {
  success: boolean;
  originalVersion: number;
  newVersion?: number;
  wrappedDEK?: WrappedDEK;
  error?: string;
}

export interface RotationPlan {
  totalDEKs: number;
  tasksRequired: number;
  highPriorityTasks: number;
  tasks: RotationTask[];
  estimatedDuration: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  requiredVersions: number[];
}
