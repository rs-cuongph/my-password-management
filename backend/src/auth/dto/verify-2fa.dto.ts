import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2faDto {
  @IsNotEmpty({ message: 'Temp token is required' })
  @IsString()
  tempToken: string;

  @IsNotEmpty({ message: 'TOTP code is required' })
  @IsString()
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  totpCode: string;
}

export class Verify2faResponseDto {
  success: boolean;
  accessToken?: string;
  message?: string;
}