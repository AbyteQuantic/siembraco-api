// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    try {
      // Crear usuario en Firebase Auth
      const userRecord = await this.firebaseService
        .getAuthInstance()
        .createUser({
          email: createUserDto.email,
          password: createUserDto.password,
        });

      // Crear usuario en Firestore con rol
      const user = await this.usersService.create({
        ...createUserDto,
        uid: userRecord.uid,
      });

      // Generar tokens JWT
      const tokens = await this.generateTokens(user);

      return { user, tokens };
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async login(loginDto: LoginDto): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    try {
      const auth = getAuth(); // Cliente web
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginDto.email,
        loginDto.password,
      );

      // Obtener usuario completo de Firestore
      const user = await this.usersService.findOne(userCredential.user.uid);

      // Generar tokens JWT
      const tokens = await this.generateTokens(user);

      return { user, tokens };
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verificar refresh token
      const decoded = this.jwtService.verify(refreshToken);

      // Obtener usuario de Firestore
      const user = await this.usersService.findOne(decoded.uid);

      // Generar nuevo access token
      return {
        accessToken: this.jwtService.sign(
          {
            uid: user.uid,
            email: user.email,
            role: user.role,
          },
          { expiresIn: '15m' },
        ),
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      uid: user.uid,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  private handleAuthError(error: unknown): never {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('email-already-exists')) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      if (
        message.includes('invalid-credential') ||
        message.includes('wrong-password')
      ) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (message.includes('user-not-found')) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
    }

    throw new InternalServerErrorException('Error en la autenticación');
  }
}
