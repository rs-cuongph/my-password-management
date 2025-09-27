export class UserProfileDto {
  id: number;
  email: string;
  isActive: boolean;
  need2fa: boolean;
  createdAt: Date;
  updatedAt: Date;
}
