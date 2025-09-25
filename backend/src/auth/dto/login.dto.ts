import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(1)
  password: string;
}

export class LoginResponseDto {
  success: boolean;
  tempToken?: string;
  need2fa: boolean;
  kdfSalt: string;
  message?: string;
}
