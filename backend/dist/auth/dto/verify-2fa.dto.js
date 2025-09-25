"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Verify2faResponseDto = exports.Verify2faDto = void 0;
const class_validator_1 = require("class-validator");
class Verify2faDto {
    tempToken;
    totpCode;
}
exports.Verify2faDto = Verify2faDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Temp token is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Verify2faDto.prototype, "tempToken", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'TOTP code is required' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6, { message: 'TOTP code must be exactly 6 digits' }),
    __metadata("design:type", String)
], Verify2faDto.prototype, "totpCode", void 0);
class Verify2faResponseDto {
    success;
    accessToken;
    message;
}
exports.Verify2faResponseDto = Verify2faResponseDto;
//# sourceMappingURL=verify-2fa.dto.js.map