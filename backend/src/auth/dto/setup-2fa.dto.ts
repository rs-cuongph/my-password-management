import { IsNotEmpty, IsString } from 'class-validator';

export class Setup2faDto {
  @IsNotEmpty({ message: 'Temp token is required' })
  @IsString()
  tempToken: string;
}

export class Setup2faResponseDto {
  success: boolean;
  otpauthUri: string;
  qrCode?: string; // Base64 encoded QR code
  message?: string;
}