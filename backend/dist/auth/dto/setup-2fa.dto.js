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
exports.Setup2faResponseDto = exports.Setup2faDto = void 0;
const class_validator_1 = require("class-validator");
class Setup2faDto {
    tempToken;
}
exports.Setup2faDto = Setup2faDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Temp token is required' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Setup2faDto.prototype, "tempToken", void 0);
class Setup2faResponseDto {
    success;
    otpauthUri;
    qrCode;
    message;
}
exports.Setup2faResponseDto = Setup2faResponseDto;
//# sourceMappingURL=setup-2fa.dto.js.map