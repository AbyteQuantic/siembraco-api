// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly usersCollection = 'users';

  constructor(private firebaseService: FirebaseService) {}

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      throw new Error(`User operation failed: ${error.message}`);
    }
    throw new Error('Unknown error occurred during user operation');
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role } = createUserDto;

    try {
      const userRecord = await this.firebaseService
        .getAuthInstance()
        .createUser({ email, password });

      const userData: User = {
        uid: userRecord.uid,
        email: userRecord.email!, // Firebase garantiza email cuando se crea con email/password
        role,
        createdAt: new Date(),
      };

      await this.firebaseService
        .getFirestoreInstance()
        .collection(this.usersCollection)
        .doc(userRecord.uid)
        .set(userData);

      return userData;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async findOne(uid: string): Promise<User> {
    try {
      const userDoc = await this.firebaseService
        .getFirestoreInstance()
        .collection(this.usersCollection)
        .doc(uid)
        .get();

      if (!userDoc.exists) {
        throw new NotFoundException(`User ${uid} not found`);
      }

      const userData = userDoc.data();

      // Validación de tipo en runtime
      if (!userData || !this.isValidUser(userData)) {
        throw new Error('Invalid user data structure');
      }

      return userData;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      return this.handleError(error);
    }
  }

  private isValidUser(data: unknown): data is User {
    // Verificar que es un objeto
    if (typeof data !== 'object' || data === null) return false;

    // Type Guard con verificación explícita de tipos
    const user = data as Record<string, unknown>;

    return (
      typeof user.uid === 'string' &&
      typeof user.email === 'string' &&
      this.isValidUserRole(user.role) &&
      this.isValidDate(user.createdAt)
    );
  }

  private isValidUserRole(role: unknown): role is UserRole {
    return (
      typeof role === 'string' &&
      Object.values(UserRole).includes(role as UserRole)
    );
  }

  private isValidDate(date: unknown): date is Date {
    return (
      date instanceof Date ||
      (typeof date === 'string' && !isNaN(Date.parse(date)))
    );
  }

  async findAll(): Promise<User[]> {
    const snapshot = await this.firebaseService
      .getFirestoreInstance()
      .collection(this.usersCollection)
      .get();
    return snapshot.docs.map(doc => doc.data() as User);
  }

  async update(uid: string, updateData: Partial<User>): Promise<User> {
    await this.firebaseService
      .getFirestoreInstance()
      .collection(this.usersCollection)
      .doc(uid)
      .update(updateData);
    return this.findOne(uid);
  }

  async remove(uid: string): Promise<void> {
    await this.firebaseService
      .getFirestoreInstance()
      .collection(this.usersCollection)
      .doc(uid)
      .delete();
  }
}
