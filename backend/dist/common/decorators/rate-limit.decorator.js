"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrictRateLimit = exports.AuthRateLimit = exports.SensitiveRateLimit = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.RATE_LIMIT_KEY = 'rateLimit';
const RateLimit = (limit, ttl) => (0, common_1.SetMetadata)(exports.RATE_LIMIT_KEY, { limit, ttl });
exports.RateLimit = RateLimit;
const SensitiveRateLimit = () => (0, exports.RateLimit)(5, 15 * 60 * 1000);
exports.SensitiveRateLimit = SensitiveRateLimit;
const AuthRateLimit = () => (0, exports.RateLimit)(10, 15 * 60 * 1000);
exports.AuthRateLimit = AuthRateLimit;
const StrictRateLimit = () => (0, exports.RateLimit)(3, 15 * 60 * 1000);
exports.StrictRateLimit = StrictRateLimit;
//# sourceMappingURL=rate-limit.decorator.js.map