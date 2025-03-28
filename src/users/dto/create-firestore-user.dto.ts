import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateFirestoreUserDto {
  @IsString()
  @IsNotEmpty()
  uid: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsDate()
  @IsNotEmpty()
  createdAt: Date;
}
