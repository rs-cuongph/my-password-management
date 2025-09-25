"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionUtil = void 0;
const crypto = __importStar(require("crypto"));
class EncryptionUtil {
    static ALGORITHM = 'aes-256-gcm';
    static KEY_LENGTH = 32;
    static IV_LENGTH = 16;
    static TAG_LENGTH = 16;
    static generateKey() {
        return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
    }
    static encrypt(data, key) {
        try {
            const keyBuffer = Buffer.from(key, 'hex');
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);
            cipher.setAAD(Buffer.from('totp-secret', 'utf8'));
            let encrypted = cipher.update(data, 'utf8', 'base64');
            encrypted += cipher.final('base64');
            const tag = cipher.getAuthTag();
            const combined = Buffer.concat([
                iv,
                tag,
                Buffer.from(encrypted, 'base64')
            ]);
            return combined.toString('base64');
        }
        catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }
    static decrypt(encryptedData, key) {
        try {
            const keyBuffer = Buffer.from(key, 'hex');
            const combined = Buffer.from(encryptedData, 'base64');
            const iv = combined.subarray(0, this.IV_LENGTH);
            const tag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH);
            const encrypted = combined.subarray(this.IV_LENGTH + this.TAG_LENGTH);
            const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, iv);
            decipher.setAAD(Buffer.from('totp-secret', 'utf8'));
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encrypted, undefined, 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }
    static generateServerKey() {
        return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
    }
}
exports.EncryptionUtil = EncryptionUtil;
//# sourceMappingURL=encryption.util.js.map