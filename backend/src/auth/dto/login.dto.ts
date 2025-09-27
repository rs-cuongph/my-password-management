import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class LoginResponseDto {
  success: boolean;
  tempToken?: string; // For 2FA verification
  accessToken?: string; // For direct login (no 2FA)
  need2fa: boolean;
  kdfSalt: string;
  message?: string;
}
