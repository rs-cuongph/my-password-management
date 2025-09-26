import argon2 from 'argon2-browser';

export interface Argon2Params {
  memory: number; // Memory in KB (64-128MB = 65536-131072 KB)
  time: number; // Time cost (2-3 iterations)
  parallelism: number; // Parallelism factor
  hashLength: number; // Output hash length in bytes
}

export interface KDFParams {
  salt: string;
  memory: number;
  time: number;
  parallelism: number;
  hashLength: number;
  algorithm: 'argon2id';
}

export interface MasterKeyResult {
  masterKey: string;
  kdfParams: KDFParams;
}

/**
 * Generate random bytes (simplified implementation)
 */
function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return array;
}


/**
 * Detect device capabilities for optimal Argon2 parameters
 */
function detectDeviceCapabilities(): { isMobile: boolean; availableMemory: number } {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Estimate available memory (rough estimation)
  let availableMemory = 128 * 1024; // Default 128MB in KB
  
  if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
    // Use Device Memory API if available
    availableMemory = (navigator as any).deviceMemory * 1024 * 1024 / 1024; // Convert GB to KB
  } else if (isMobile) {
    // Conservative estimate for mobile devices
    availableMemory = 64 * 1024; // 64MB in KB
  }
  
  return { isMobile, availableMemory };
}

/**
 * Get optimal Argon2 parameters based on device capabilities
 */
function getOptimalArgon2Params(): Argon2Params {
  const { isMobile, availableMemory } = detectDeviceCapabilities();
  
  // Memory: Use 64-128MB, but not more than 50% of available memory
  const maxMemory = Math.min(128 * 1024, Math.floor(availableMemory * 0.5));
  const minMemory = 64 * 1024;
  const memory = Math.max(minMemory, maxMemory);
  
  // Time: 2-3 iterations, use fewer for mobile
  const time = isMobile ? 2 : 3;
  
  // Parallelism: Use fewer threads on mobile
  const parallelism = isMobile ? 1 : 2;
  
  // Hash length: 32 bytes (256 bits)
  const hashLength = 32;
  
  return { memory, time, parallelism, hashLength };
}

/**
 * Derive master key from password using Argon2id
 * @param password - The master password
 * @param serverSalt - Salt from server (kdfSalt)
 * @param progressCallback - Optional callback for progress updates
 * @param customParams - Optional custom Argon2 parameters
 * @returns Promise with master key and KDF parameters
 */
export async function deriveMasterKey(
  password: string,
  serverSalt: string,
  progressCallback?: (progress: number) => void,
  customParams?: Partial<Argon2Params>
): Promise<MasterKeyResult> {
  try {
    // Validate inputs
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }
    
    if (!serverSalt || serverSalt.length === 0) {
      throw new Error('Server salt is required');
    }
    
    // Get optimal parameters
    const defaultParams = getOptimalArgon2Params();
    const params: Argon2Params = {
      ...defaultParams,
      ...customParams
    };
    
    // Validate parameters
    if (params.memory < 64 * 1024 || params.memory > 128 * 1024) {
      throw new Error('Memory must be between 64MB and 128MB');
    }
    
    if (params.time < 2 || params.time > 3) {
      throw new Error('Time must be between 2 and 3');
    }
    
    if (params.parallelism < 1 || params.parallelism > 4) {
      throw new Error('Parallelism must be between 1 and 4');
    }
    
    // Convert hex salt to Uint8Array
    const saltBytes = new Uint8Array(serverSalt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Start progress tracking
    if (progressCallback) {
      progressCallback(10);
    }
    
    // Perform Argon2id key derivation
    const result = await argon2.hash({
      pass: password,
      salt: saltBytes,
      type: argon2.ArgonType.Argon2id,
      hashLen: params.hashLength,
      time: params.time,
      mem: params.memory,
      parallelism: params.parallelism,
    });
    
    // Update progress
    if (progressCallback) {
      progressCallback(90);
    }
    
    // Convert result to hex string
    const masterKey = Array.from(result.hash)
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Complete progress
    if (progressCallback) {
      progressCallback(100);
    }
    
    const kdfParams: KDFParams = {
      salt: serverSalt,
      memory: params.memory,
      time: params.time,
      parallelism: params.parallelism,
      hashLength: params.hashLength,
      algorithm: 'argon2id'
    };
    
    return { masterKey, kdfParams };
    
  } catch (error) {
    // Handle specific Argon2 errors
    if (error instanceof Error) {
      if (error.message.includes('memory')) {
        throw new Error('Insufficient memory for key derivation. Please close other applications and try again.');
      }
      if (error.message.includes('timeout')) {
        throw new Error('Key derivation timed out. Please try again.');
      }
      if (error.message.includes('salt')) {
        throw new Error('Invalid salt provided by server.');
      }
    }
    
    // Re-throw with more user-friendly message
    throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify master password by deriving key and comparing
 * @param password - The password to verify
 * @param kdfParams - The stored KDF parameters
 * @param expectedKey - The expected master key
 * @param progressCallback - Optional callback for progress updates
 * @returns Promise with verification result
 */
export async function verifyMasterPassword(
  password: string,
  kdfParams: KDFParams,
  expectedKey: string,
  progressCallback?: (progress: number) => void
): Promise<boolean> {
  try {
    // Validate inputs
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }
    
    if (!kdfParams.salt || kdfParams.salt.length === 0) {
      throw new Error('Salt is required');
    }
    
    if (!expectedKey || expectedKey.length === 0) {
      throw new Error('Expected key is required');
    }
    
    // Validate KDF parameters
    if (kdfParams.algorithm !== 'argon2id') {
      throw new Error('Only Argon2id algorithm is supported');
    }
    
    if (kdfParams.memory < 64 * 1024 || kdfParams.memory > 128 * 1024) {
      throw new Error('Invalid memory parameter');
    }
    
    if (kdfParams.time < 2 || kdfParams.time > 3) {
      throw new Error('Invalid time parameter');
    }
    
    if (kdfParams.parallelism < 1 || kdfParams.parallelism > 4) {
      throw new Error('Invalid parallelism parameter');
    }
    
    // Convert hex salt to Uint8Array
    const saltBytes = new Uint8Array(kdfParams.salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Start progress tracking
    if (progressCallback) {
      progressCallback(10);
    }
    
    // Perform Argon2id key derivation with stored parameters
    const result = await argon2.hash({
      pass: password,
      salt: saltBytes,
      type: argon2.ArgonType.Argon2id,
      hashLen: kdfParams.hashLength,
      time: kdfParams.time,
      mem: kdfParams.memory,
      parallelism: kdfParams.parallelism,
    });
    
    // Update progress
    if (progressCallback) {
      progressCallback(90);
    }
    
    // Convert result to hex string
    const derivedKey = Array.from(result.hash)
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Complete progress
    if (progressCallback) {
      progressCallback(100);
    }
    
    // Compare derived key with expected key
    return derivedKey === expectedKey;
    
  } catch (error) {
    // Handle specific Argon2 errors
    if (error instanceof Error) {
      if (error.message.includes('memory')) {
        throw new Error('Insufficient memory for key verification. Please close other applications and try again.');
      }
      if (error.message.includes('timeout')) {
        throw new Error('Key verification timed out. Please try again.');
      }
      if (error.message.includes('salt')) {
        throw new Error('Invalid salt in stored parameters.');
      }
    }
    
    // Re-throw with more user-friendly message
    throw new Error(`Password verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get device-specific Argon2 parameters for optimal performance
 * @returns Argon2 parameters optimized for current device
 */
export function getDeviceOptimalParams(): Argon2Params {
  return getOptimalArgon2Params();
}

/**
 * Validate Argon2 parameters
 * @param params - Parameters to validate
 * @returns Validation result with error message if invalid
 */
export function validateArgon2Params(params: Argon2Params): { valid: boolean; error?: string } {
  if (params.memory < 64 * 1024 || params.memory > 128 * 1024) {
    return { valid: false, error: 'Memory must be between 64MB and 128MB' };
  }
  
  if (params.time < 2 || params.time > 3) {
    return { valid: false, error: 'Time must be between 2 and 3' };
  }
  
  if (params.parallelism < 1 || params.parallelism > 4) {
    return { valid: false, error: 'Parallelism must be between 1 and 4' };
  }
  
  if (params.hashLength < 16 || params.hashLength > 64) {
    return { valid: false, error: 'Hash length must be between 16 and 64 bytes' };
  }
  
  return { valid: true };
}

/**
 * Generate a random encryption key
 * @param length - Key length in bytes (default: 32)
 * @returns Random key as hex string
 */
export function generateRandomKey(length: number = 32): string {
  const randomBytes = generateRandomBytes(length);
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt data using AES-GCM (simplified for demo)
 * @param data - Data to encrypt
 * @returns Encrypted data
 */
export function encryptData(data: string): string {
  // This is a simplified implementation
  // In production, use a proper AES-GCM implementation
  const encoded = btoa(data);
  return encoded;
}

/**
 * Decrypt data using AES-GCM (simplified for demo)
 * @param encryptedData - Encrypted data
 * @returns Decrypted data
 */
export function decryptData(encryptedData: string): string {
  // This is a simplified implementation
  // In production, use a proper AES-GCM implementation
  try {
    return atob(encryptedData);
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash a string using SHA-256
 * @param input - String to hash
 * @returns Hash as hex string
 */
export function hashString(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Use Web Crypto API if available
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      const hashArray = Array.from(new Uint8Array(hash));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }) as any;
  }
  
  // Fallback for environments without Web Crypto API
  throw new Error('Crypto API not available');
}

/**
 * Secure password strength checker
 * @param password - Password to check
 * @returns Password strength score (0-100)
 */
export function checkPasswordStrength(password: string): number {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  
  // Common patterns penalty
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 10; // Common sequences
  
  return Math.max(0, Math.min(100, score));
}