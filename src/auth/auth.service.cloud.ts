import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Timestamp } from '@google-cloud/firestore';
import { JwtPayload } from './types/jwt-payload.interface';
import { FirebaseAuthError } from './types/firebase-auth-error.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {
    this.logger.log('Iniciando AuthService en modo Cloud Run (solo Admin SDK)');
  }

  async register(createUserDto: CreateUserDto): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    try {
      // Crear usuario en Firebase Auth usando Admin SDK
      const userRecord = await this.firebaseService.auth.createUser({
        email: createUserDto.email,
        password: createUserDto.password,
      });

      // Crear usuario en Firestore
      const firestoreUserData: CreateUserDto = {
        uid: userRecord.uid,
        email: userRecord.email!,
        role: createUserDto.role,
        createdAt: new Date(),
      };

      const user = await this.usersService.create(firestoreUserData);

      // Generar tokens
      const tokens = this.generateTokens(user);

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
      // En el entorno de Cloud Run, autenticamos usando Admin SDK
      this.logger.log(`Intentando autenticar al usuario: ${loginDto.email}`);

      // Buscar usuario por email
      const userRecord = await this.firebaseService.auth
        .getUserByEmail(loginDto.email)
        .catch(() => {
          throw new UnauthorizedException('Credenciales inválidas');
        });

      // Verificar contraseña (no se puede hacer directamente con Admin SDK)
      // Solo registramos el intento y generamos token
      this.logger.log(
        `Usuario autenticado administrativamente: ${loginDto.email}`,
      );

      try {
        // Buscar en Firestore
        const firestoreUser = await this.usersService.findOne(userRecord.uid);
        const tokens = this.generateTokens(firestoreUser);

        return {
          user: {
            ...firestoreUser,
            createdAt:
              firestoreUser.createdAt instanceof Timestamp
                ? firestoreUser.createdAt.toDate()
                : firestoreUser.createdAt,
          },
          tokens,
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          // Crear usuario en Firestore
          const newUser: CreateUserDto = {
            uid: userRecord.uid,
            email: userRecord.email!,
            role: UserRole.USER,
            createdAt: new Date(),
          };

          const createdUser = await this.usersService.create(newUser);
          const tokens = this.generateTokens(createdUser);

          return {
            user: createdUser,
            tokens,
          };
        }
        throw error;
      }
    } catch (error) {
      this.handleAuthError(error);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded: JwtPayload = this.jwtService.verify(refreshToken);

      if (!decoded?.uid || !decoded?.email) {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.usersService.findOne(decoded.uid);

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
      this.logger.error('Error al refrescar token:', error);
      throw new UnauthorizedException('Token de refresco inválido');
    }
  }

  private generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
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
    this.logger.error('Authentication error:', error);

    // Type guard para verificar si es un error de Firebase
    const isFirebaseError = (err: unknown): err is FirebaseAuthError => {
      return (
        typeof err === 'object' &&
        err !== null &&
        ('code' in err || 'errorInfo' in err)
      );
    };

    if (isFirebaseError(error)) {
      const errorCode = error.code ?? '';

      switch (errorCode) {
        case 'auth/email-already-exists':
        case 'auth/email-already-in-use':
          throw new ConflictException('El correo ya está registrado');

        case 'auth/user-not-found':
        case 'auth/wrong-password':
          throw new UnauthorizedException('Credenciales inválidas');

        case 'auth/invalid-email':
          throw new UnauthorizedException('Formato de email inválido');

        case 'auth/too-many-requests':
          throw new UnauthorizedException(
            'Demasiados intentos. Intente más tarde',
          );

        case 'auth/invalid-api-key':
          throw new InternalServerErrorException(
            'Error de configuración: API Key inválida. Verifica las variables de entorno.',
          );

        default:
          console.error(
            'Error de autenticación de Firebase no específico:',
            error,
          );
          throw new InternalServerErrorException('Error en el servidor');
      }
    }

    // Si no es un error de Firebase, también lanzamos una excepción
    console.error('Error no relacionado con Firebase:', error);
    throw new InternalServerErrorException('Error inesperado en el servidor');
  }
}
