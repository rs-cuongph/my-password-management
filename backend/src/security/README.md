# DEK (Data Encryption Key) Implementation

This module implements DEK (Data Encryption Key) wrapping and unwrapping functionality using XChaCha20-Poly1305 authenticated encryption.

## Features

- ✅ **256-bit DEK Generation**: Cryptographically secure random key generation
- ✅ **XChaCha20-Poly1305 Encryption**: Industry-standard authenticated encryption
- ✅ **Secure Memory Management**: Automatic memory clearing after use
- ✅ **Key Rotation Support**: Future-proof version management
- ✅ **Proper Nonce Handling**: Secure random nonce generation
- ✅ **Master Key Derivation**: Password-based key derivation using Argon2id
- ✅ **Comprehensive Testing**: Full test coverage for all functionality

## Architecture

### Core Components

1. **DEKService** (`src/security/services/dek.service.ts`)
   - Core DEK operations (generate, wrap, unwrap)
   - Memory management and secure clearing
   - Master key operations

2. **KeyRotationService** (`src/security/services/key-rotation.service.ts`)
   - Key version management
   - Rotation planning and execution
   - Deprecation handling

3. **DEKController** (`src/security/controllers/dek.controller.ts`)
   - HTTP API endpoints for DEK operations
   - Request/response validation
   - Rate limiting for sensitive operations

### Interfaces & DTOs

- **Interfaces** (`src/security/interfaces/dek.interface.ts`)
- **DTOs** (`src/security/dto/dek.dto.ts`)

## API Endpoints

All endpoints require JWT authentication and are rate-limited for security.

### DEK Operations

```typescript
POST /api/v1/security/dek/generate
POST /api/v1/security/dek/wrap  
POST /api/v1/security/dek/unwrap
```

### Key Rotation

```typescript
POST /api/v1/security/dek/rotation-info
POST /api/v1/security/dek/rotate
```

### Master Key Operations

```typescript
GET  /api/v1/security/dek/master-key/generate
POST /api/v1/security/dek/master-key/derive
```

## Usage Examples

### Basic DEK Operations

```typescript
import { DEKService } from './services/dek.service';

// Generate a new DEK
const dekResult = await dekService.generateDEK();
console.log('DEK generated:', Buffer.from(dekResult.dek).toString('base64'));

// Generate a master key
const masterKey = await dekService.generateMasterKey();

// Wrap the DEK
const wrappedDEK = await dekService.wrapDEK(dekResult.dek, masterKey);
console.log('DEK wrapped successfully');

// Unwrap the DEK
const unwrappedResult = await dekService.unwrapDEK(wrappedDEK, masterKey);
console.log('DEK unwrapped successfully');

// Clean up sensitive data
dekService.clearMemory([dekResult.dek, masterKey, unwrappedResult.dek]);
```

### Password-Based Master Key

```typescript
// Derive master key from password
const password = 'user-secure-password';
const salt = await dekService.generateSalt();
const masterKey = await dekService.deriveMasterKey(password, salt);

// Use the derived master key for DEK operations
const wrappedDEK = await dekService.wrapDEK(dek, masterKey);

// Clean up
dekService.clearMemory([masterKey, salt]);
```

### Key Rotation

```typescript
import { KeyRotationService } from './services/key-rotation.service';

// Analyze rotation requirements
const analysis = keyRotationService.analyzeRotationRequirements(wrappedDEKs);
console.log('Rotation needed:', analysis.rotationInfo.rotationNeeded);

// Generate rotation plan
const masterKeyMapping = new Map();
masterKeyMapping.set(0, oldMasterKey);
masterKeyMapping.set(1, newMasterKey);

const plan = keyRotationService.generateRotationPlan(wrappedDEKs, masterKeyMapping);
console.log('Tasks required:', plan.tasksRequired);

// Execute rotation
const results = await keyRotationService.bulkRotateDEKs(plan.tasks);
console.log('Rotation results:', results);
```

## Security Features

### Memory Management

All sensitive data is automatically cleared from memory:

```typescript
// Automatic clearing in service methods
const result = await dekService.generateDEK();
// ... use the DEK
dekService.clearMemory(result.dek); // Explicit clearing

// The service also clears temporary data automatically
```

### Authenticated Encryption

XChaCha20-Poly1305 provides:
- **Confidentiality**: Data encryption with XChaCha20
- **Authenticity**: Integrity protection with Poly1305 MAC
- **Resistance to nonce reuse**: XChaCha20's extended nonce space

### Key Derivation

Argon2id for password-based key derivation:
- **Memory-hard**: Resistant to specialized hardware attacks
- **Time-hard**: Configurable computational cost
- **Side-channel resistant**: Constant-time implementation

## Configuration

### Environment Variables

```bash
# Optional: Custom configuration (uses secure defaults)
DEK_DEFAULT_VERSION=1
DEK_MAX_AGE_DAYS=365
```

### Version Management

The system supports versioned DEKs for future algorithm upgrades:

```typescript
// Current version (default)
const dek = await dekService.generateDEK({ version: 1 });

// Future versions can be added without breaking existing DEKs
const futureDEK = await dekService.generateDEK({ version: 2 });
```

## Error Handling

The implementation includes comprehensive error handling:

- **BadRequestException**: Invalid input parameters
- **InternalServerErrorException**: Cryptographic operation failures
- **Memory clearing**: Always attempted, even on errors

```typescript
try {
  const result = await dekService.wrapDEK(dek, masterKey);
  return result;
} catch (error) {
  // Sensitive data is still cleared automatically
  throw error;
} finally {
  // Explicit cleanup if needed
  dekService.clearMemory([dek, masterKey]);
}
```

## Testing

Comprehensive test suite covering:

- ✅ DEK generation and validation
- ✅ Wrap/unwrap operations
- ✅ Memory management
- ✅ Key rotation functionality
- ✅ Error conditions
- ✅ Edge cases

Run tests with:
```bash
# If Jest is configured
npm test -- src/security/services/__tests__/

# Or run specific test files
npx jest src/security/services/__tests__/dek.service.spec.ts
```

## Implementation Details

### Cryptographic Specifications

- **DEK Size**: 256 bits (32 bytes)
- **Nonce Size**: 192 bits (24 bytes) for XChaCha20
- **Tag Size**: 128 bits (16 bytes) for Poly1305
- **Master Key Size**: 256 bits (32 bytes)
- **Salt Size**: 256 bits (32 bytes) for Argon2id

### Data Format

Wrapped DEK structure:
```typescript
{
  encryptedDEK: string;    // Base64-encoded ciphertext
  nonce: string;           // Base64-encoded nonce
  tag: string;             // Base64-encoded authentication tag
  metadata: {
    version: number;       // Version for rotation support
    createdAt: Date;       // Creation timestamp
    algorithm: string;     // "xchacha20-poly1305"
  }
}
```

### Performance Considerations

- **Memory efficient**: Immediate cleanup of sensitive data
- **Constant time**: Cryptographic operations resist timing attacks
- **Minimal allocations**: Reuse of Uint8Array objects where possible
- **Batch operations**: Bulk rotation support for multiple DEKs

## Future Enhancements

Planned improvements:

1. **Hardware Security Module (HSM) Support**
2. **Key Escrow and Recovery**
3. **Audit Logging for Key Operations**
4. **Integration with External Key Management Systems**
5. **Performance Optimizations for High-Volume Operations**

## Dependencies

- **libsodium-wrappers**: XChaCha20-Poly1305 and Argon2id implementation
- **@nestjs/common**: Framework integration
- **@nestjs/config**: Configuration management

## Security Considerations

1. **Key Storage**: Master keys should be stored securely (HSM, key management service)
2. **Network Security**: All API calls should use HTTPS
3. **Rate Limiting**: Built-in rate limiting prevents abuse
4. **Memory Protection**: Automatic clearing prevents memory dumps
5. **Audit Trails**: Consider adding comprehensive logging

---

## Integration Example

```typescript
// In your vault service
import { DEKService } from '../security/services/dek.service';

@Injectable()
export class VaultService {
  constructor(private dekService: DEKService) {}

  async createVault(password: string): Promise<VaultData> {
    // Derive master key from password
    const salt = await this.dekService.generateSalt();
    const masterKey = await this.dekService.deriveMasterKey(password, salt);

    // Generate and wrap DEK
    const dekResult = await this.dekService.generateDEK();
    const wrappedDEK = await this.dekService.wrapDEK(dekResult.dek, masterKey);

    // Use DEK for actual data encryption
    const encryptedData = await this.encryptVaultData(data, dekResult.dek);

    // Clean up sensitive data
    this.dekService.clearMemory([masterKey, dekResult.dek]);

    return {
      encryptedData,
      wrappedDEK,
      salt: Buffer.from(salt).toString('base64'),
    };
  }

  async unlockVault(password: string, vaultData: VaultData): Promise<any> {
    // Reconstruct master key from password
    const salt = Buffer.from(vaultData.salt, 'base64');
    const masterKey = await this.dekService.deriveMasterKey(password, salt);

    try {
      // Unwrap DEK
      const dekResult = await this.dekService.unwrapDEK(vaultData.wrappedDEK, masterKey);
      
      // Decrypt vault data
      const decryptedData = await this.decryptVaultData(vaultData.encryptedData, dekResult.dek);

      return decryptedData;
    } finally {
      // Always clean up
      this.dekService.clearMemory([masterKey, dekResult?.dek]);
    }
  }
}
```

This implementation provides enterprise-grade DEK management with strong security guarantees and forward compatibility through version management.