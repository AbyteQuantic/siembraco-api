import { Timestamp } from '@google-cloud/firestore';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  FARMER = 'FARMER',
  CUSTOMER = 'CUSTOMER',
}

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date | Timestamp;
}
