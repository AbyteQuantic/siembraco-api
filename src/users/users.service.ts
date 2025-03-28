import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly usersCollection = 'users';

  constructor(private firebaseService: FirebaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userData: User = {
      uid: createUserDto.uid,
      email: createUserDto.email,
      role: createUserDto.role,
      createdAt: new Date(),
    };

    await this.firebaseService.firestore
      .collection(this.usersCollection)
      .doc(createUserDto.uid)
      .set(userData);

    return userData;
  }

  async findOne(uid: string): Promise<User> {
    const doc = await this.firebaseService.firestore
      .collection(this.usersCollection)
      .doc(uid)
      .get();

    if (!doc.exists) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return doc.data() as User;
  }

  async findAll(): Promise<User[]> {
    const snapshot = await this.firebaseService.firestore
      .collection(this.usersCollection)
      .get();

    return snapshot.docs.map((doc) => doc.data() as User);
  }

  async update(uid: string, updateUserDto: UpdateUserDto): Promise<User> {
    const userRef = this.firebaseService.firestore
      .collection(this.usersCollection)
      .doc(uid);

    const doc = await userRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updatedUserData = {
      ...doc.data(),
      ...updateUserDto,
    };

    await userRef.update(updatedUserData);

    return updatedUserData as User;
  }

  async remove(uid: string): Promise<void> {
    const userRef = this.firebaseService.firestore
      .collection(this.usersCollection)
      .doc(uid);

    const doc = await userRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await userRef.delete();
  }
}
