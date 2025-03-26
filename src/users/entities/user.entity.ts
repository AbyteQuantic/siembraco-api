import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  FARMER = 'farmer',
  CUSTOMER = 'customer',
}

export class User {
  @ApiProperty()
  uid: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  createdAt: Date;
}
