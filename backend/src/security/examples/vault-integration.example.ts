/**
 * Example: Integrating DEK service with a vault system
 * 
 * This example demonstrates how to use the DEK service to implement
 * a secure vault that encrypts user data with wrapped DEKs.
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { DEKService } from '../services/dek.service';
import { KeyRotationService } from '../services/key-rotation.service';
import { WrappedDEK } from '../interfaces/dek.interface';
import * as crypto from 'crypto';

export interface VaultData {
  id: string;
  encryptedData: string;
  wrappedDEK: WrappedDEK;
  salt: string;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface VaultUnlockResult {
  data: any;
  needsRotation: boolean;
  rotationRecommendations?: string[];
}

@Injectable()
export class VaultService {
  constructor(
    private dekService: DEKService,
    private keyRotationService: KeyRotationService,
  ) {}

  /**
   * Create a new vault with encrypted data
   */
  async createVault(
    password: string,
    data: any,
    vaultId?: string,
  ): Promise<VaultData> {
    let salt: Uint8Array | undefined;
    let masterKey: Uint8Array | undefined;
    let dekResult: any;

    try {
      // Generate salt for password-based key derivation
      salt = await this.dekService.generateSalt();
      
      // Derive master key from password
      masterKey = await this.dekService.deriveMasterKey(password, salt);

      // Generate a new DEK
      dekResult = await this.dekService.generateDEK({
        version: this.keyRotationService.getLatestVersion(),
      });

      // Wrap the DEK with the master key
      const wrappedDEK = await this.dekService.wrapDEK(
        dekResult.dek,
        masterKey,
        {
          aad: vaultId || 'default-vault',
        },
      );

      // Encrypt the actual data with the DEK
      const encryptedData = this.encryptData(
        JSON.stringify(data),
        dekResult.dek,
      );

      const vaultData: VaultData = {
        id: vaultId || crypto.randomUUID(),
        encryptedData,
        wrappedDEK,
        salt: Buffer.from(salt).toString('base64'),
        createdAt: new Date(),
        lastAccessedAt: new Date(),
      };

      return vaultData;
    } finally {
      // Always clean up sensitive data
      if (salt) this.dekService.clearMemory(salt);
      if (masterKey) this.dekService.clearMemory(masterKey);
      if (dekResult?.dek) this.dekService.clearMemory(dekResult.dek);
    }
  }

  /**
   * Unlock and decrypt vault data
   */
  async unlockVault(
    password: string,
    vaultData: VaultData,
  ): Promise<VaultUnlockResult> {
    let salt: Uint8Array | undefined;
    let masterKey: Uint8Array | undefined;
    let dekResult: any;

    try {
      // Reconstruct salt and master key
      salt = new Uint8Array(Buffer.from(vaultData.salt, 'base64'));
      masterKey = await this.dekService.deriveMasterKey(password, salt);

      // Unwrap the DEK
      dekResult = await this.dekService.unwrapDEK(
        vaultData.wrappedDEK,
        masterKey,
        {
          aad: vaultData.id,
        },
      );

      // Decrypt the data
      const decryptedData = this.decryptData(
        vaultData.encryptedData,
        dekResult.dek,
      );

      // Check if key rotation is needed
      const analysis = this.keyRotationService.analyzeRotationRequirements([
        vaultData.wrappedDEK,
      ]);

      const result: VaultUnlockResult = {
        data: JSON.parse(decryptedData),
        needsRotation: analysis.rotationInfo.rotationNeeded,
        rotationRecommendations: analysis.recommendations.map(r => r.reason),
      };

      return result;
    } catch (error) {
      throw new BadRequestException('Failed to unlock vault: Invalid password or corrupted data');
    } finally {
      // Always clean up sensitive data
      if (salt) this.dekService.clearMemory(salt);
      if (masterKey) this.dekService.clearMemory(masterKey);
      if (dekResult?.dek) this.dekService.clearMemory(dekResult.dek);
    }
  }

  /**
   * Rotate vault keys to latest version
   */
  async rotateVaultKeys(
    password: string,
    vaultData: VaultData,
  ): Promise<VaultData> {
    let oldSalt: Uint8Array | undefined;
    let oldMasterKey: Uint8Array | undefined;
    let newSalt: Uint8Array | undefined;
    let newMasterKey: Uint8Array | undefined;

    try {
      // Reconstruct old master key
      oldSalt = new Uint8Array(Buffer.from(vaultData.salt, 'base64'));
      oldMasterKey = await this.dekService.deriveMasterKey(password, oldSalt);

      // Generate new salt and master key
      newSalt = await this.dekService.generateSalt();
      newMasterKey = await this.dekService.deriveMasterKey(password, newSalt);

      // Rotate the DEK
      const rotatedWrappedDEK = await this.dekService.rotateDEK(
        vaultData.wrappedDEK,
        oldMasterKey,
        newMasterKey,
        this.keyRotationService.getLatestVersion(),
      );

      // Return updated vault data
      return {
        ...vaultData,
        wrappedDEK: rotatedWrappedDEK,
        salt: Buffer.from(newSalt).toString('base64'),
        lastAccessedAt: new Date(),
      };
    } finally {
      // Clean up all sensitive data
      if (oldSalt) this.dekService.clearMemory(oldSalt);
      if (oldMasterKey) this.dekService.clearMemory(oldMasterKey);
      if (newSalt) this.dekService.clearMemory(newSalt);
      if (newMasterKey) this.dekService.clearMemory(newMasterKey);
    }
  }

  /**
   * Change vault password
   */
  async changeVaultPassword(
    oldPassword: string,
    newPassword: string,
    vaultData: VaultData,
  ): Promise<VaultData> {
    let oldSalt: Uint8Array | undefined;
    let oldMasterKey: Uint8Array | undefined;
    let newSalt: Uint8Array | undefined;
    let newMasterKey: Uint8Array | undefined;

    try {
      // Derive old master key
      oldSalt = new Uint8Array(Buffer.from(vaultData.salt, 'base64'));
      oldMasterKey = await this.dekService.deriveMasterKey(oldPassword, oldSalt);

      // Generate new salt and derive new master key
      newSalt = await this.dekService.generateSalt();
      newMasterKey = await this.dekService.deriveMasterKey(newPassword, newSalt);

      // Re-wrap the DEK with the new master key
      const rotatedWrappedDEK = await this.dekService.rotateDEK(
        vaultData.wrappedDEK,
        oldMasterKey,
        newMasterKey,
      );

      return {
        ...vaultData,
        wrappedDEK: rotatedWrappedDEK,
        salt: Buffer.from(newSalt).toString('base64'),
        lastAccessedAt: new Date(),
      };
    } finally {
      // Clean up all sensitive data
      if (oldSalt) this.dekService.clearMemory(oldSalt);
      if (oldMasterKey) this.dekService.clearMemory(oldMasterKey);
      if (newSalt) this.dekService.clearMemory(newSalt);
      if (newMasterKey) this.dekService.clearMemory(newMasterKey);
    }
  }

  /**
   * Update vault data (re-encrypt with same DEK)
   */
  async updateVaultData(
    password: string,
    vaultData: VaultData,
    newData: any,
  ): Promise<VaultData> {
    let salt: Uint8Array | undefined;
    let masterKey: Uint8Array | undefined;
    let dekResult: any;

    try {
      // Derive master key
      salt = new Uint8Array(Buffer.from(vaultData.salt, 'base64'));
      masterKey = await this.dekService.deriveMasterKey(password, salt);

      // Unwrap DEK
      dekResult = await this.dekService.unwrapDEK(
        vaultData.wrappedDEK,
        masterKey,
        { aad: vaultData.id },
      );

      // Encrypt new data with existing DEK
      const encryptedData = this.encryptData(
        JSON.stringify(newData),
        dekResult.dek,
      );

      return {
        ...vaultData,
        encryptedData,
        lastAccessedAt: new Date(),
      };
    } finally {
      // Clean up sensitive data
      if (salt) this.dekService.clearMemory(salt);
      if (masterKey) this.dekService.clearMemory(masterKey);
      if (dekResult?.dek) this.dekService.clearMemory(dekResult.dek);
    }
  }

  /**
   * Bulk rotate multiple vaults
   */
  async bulkRotateVaults(
    password: string,
    vaults: VaultData[],
  ): Promise<{ successful: VaultData[]; failed: { vault: VaultData; error: string }[] }> {
    const successful: VaultData[] = [];
    const failed: { vault: VaultData; error: string }[] = [];

    for (const vault of vaults) {
      try {
        const rotatedVault = await this.rotateVaultKeys(password, vault);
        successful.push(rotatedVault);
      } catch (error) {
        failed.push({
          vault,
          error: error.message,
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Encrypt data using AES-256-GCM with DEK
   */
  private encryptData(data: string, dek: Uint8Array): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const tag = cipher.getAuthTag();
      
      // Combine IV + tag + encrypted data
      const combined = Buffer.concat([
        iv,
        tag,
        Buffer.from(encrypted, 'base64'),
      ]);
      
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Data encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM with DEK
   */
  private decryptData(encryptedData: string, dek: Uint8Array): string {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract IV, tag, and encrypted data
      const iv = combined.subarray(0, 16);
      const tag = combined.subarray(16, 32);
      const encrypted = combined.subarray(32);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Data decryption failed: ${error.message}`);
    }
  }
}

/**
 * Example usage in a controller
 */

// @Controller('vault')
// export class VaultController {
//   constructor(private vaultService: VaultService) {}
// 
//   @Post('create')
//   async createVault(@Body() request: { password: string; data: any }) {
//     const vault = await this.vaultService.createVault(
//       request.password,
//       request.data,
//     );
//     
//     return {
//       vaultId: vault.id,
//       createdAt: vault.createdAt,
//       // Don't return sensitive data
//     };
//   }
// 
//   @Post('unlock')
//   async unlockVault(@Body() request: { password: string; vaultData: VaultData }) {
//     const result = await this.vaultService.unlockVault(
//       request.password,
//       request.vaultData,
//     );
//     
//     return {
//       data: result.data,
//       needsRotation: result.needsRotation,
//       recommendations: result.rotationRecommendations,
//     };
//   }
// 
//   @Post('rotate')
//   async rotateKeys(@Body() request: { password: string; vaultData: VaultData }) {
//     const rotatedVault = await this.vaultService.rotateVaultKeys(
//       request.password,
//       request.vaultData,
//     );
//     
//     return {
//       message: 'Keys rotated successfully',
//       rotatedAt: rotatedVault.lastAccessedAt,
//     };
//   }
// }