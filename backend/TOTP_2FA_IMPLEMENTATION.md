# TOTP 2FA Implementation

This document describes the TOTP (Time-based One-Time Password) 2FA implementation for the Vibe Kanban application.

## Overview

The implementation provides two main endpoints for TOTP 2FA setup and verification:

- `POST /auth/setup-2fa`: Generate TOTP secret and return otpauth URI
- `POST /auth/verify-2fa`: Verify TOTP code and enable 2FA

## Features

- **Secure Secret Storage**: TOTP secrets are encrypted using AES-GCM before storing in the database
- **QR Code Generation**: Automatic QR code generation for easy setup with authenticator apps
- **JWT Integration**: Short-lived JWT tokens (1 hour TTL) for enhanced security
- **Rate Limiting**: Throttling protection on all 2FA endpoints
- **Vietnamese Localization**: Error messages in Vietnamese

## API Endpoints

### 1. Setup 2FA

**Endpoint**: `POST /auth/setup-2fa`

**Request Body**:
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:
```json
{
  "success": true,
  "otpauthUri": "otpauth://totp/Vibe%20Kanban%20(username)?secret=JBSWY3DPEHPK3PXP&issuer=Vibe%20Kanban",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "TOTP secret generated successfully"
}
```

### 2. Verify 2FA

**Endpoint**: `POST /auth/verify-2fa`

**Request Body**:
```json
{
  "tempToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "totpCode": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "2FA đã được kích hoạt thành công"
}
```

## Security Features

### Encryption
- TOTP secrets are encrypted using AES-256-GCM
- Server-side encryption key stored in environment variables
- Additional authenticated data (AAD) for integrity verification

### Rate Limiting
- Setup 2FA: 3 attempts per 5 minutes per IP
- Verify 2FA: 5 attempts per minute per IP
- Login: 5 attempts per minute per IP

### Token Management
- Temporary tokens: 15 minutes TTL
- Access tokens: 1 hour TTL
- Token type validation to prevent misuse

## Database Schema

The `User` model has been updated to include:

```prisma
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  email        String   @unique
  password     String
  kdfSalt      String
  name         String?
  need2fa      Boolean  @default(false)
  totpSecret   String?  // Encrypted TOTP secret (AES-GCM encrypted)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

## Environment Variables

Required environment variables:

```env
# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=1h

# TOTP Encryption
TOTP_ENCRYPTION_KEY=your-32-character-encryption-key
```

## Dependencies

The implementation uses the following packages:

- `speakeasy`: TOTP secret generation and verification
- `qrcode`: QR code generation for authenticator apps
- `crypto`: Built-in Node.js crypto module for AES-GCM encryption

## Usage Flow

1. **User Login**: User logs in with username/password
2. **Receive Temp Token**: System returns temporary token (15 min TTL)
3. **Setup 2FA**: User calls `/auth/setup-2fa` with temp token
4. **Scan QR Code**: User scans QR code with authenticator app
5. **Verify 2FA**: User calls `/auth/verify-2fa` with temp token and TOTP code
6. **Receive Access Token**: System returns access token (1 hour TTL)

## Error Handling

The implementation includes comprehensive error handling:

- Invalid token validation
- Duplicate 2FA setup prevention
- TOTP code verification with time window tolerance
- Proper error messages in Vietnamese
- Security-focused error responses (no information leakage)

## Testing

To test the implementation:

1. Start the application
2. Register a new user or login with existing credentials
3. Use the returned `tempToken` to call `/auth/setup-2fa`
4. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)
5. Use the TOTP code from the app to call `/auth/verify-2fa`
6. Verify you receive a valid access token

## Security Considerations

- Always use HTTPS in production
- Store encryption keys securely (use proper key management)
- Regularly rotate encryption keys
- Monitor for suspicious authentication attempts
- Consider implementing backup codes for account recovery