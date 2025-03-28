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
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { Timestamp } from '@google-cloud/firestore';
import { JwtPayload } from './types/jwt-payload.interface';
import { FirebaseAuthError } from './types/firebase-auth-error.interface';
@Injectable()
export class AuthService {
  private firebaseClientApp: any;
  private firebaseClientAuth: any;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {
    const apiKey = process.env.FIREBASE_API_KEY;
    const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!apiKey || !authDomain || !projectId) {
      this.logger.error(
        'Missing Firebase configuration. Check your .env file.',
      );
      this.logger.error(`API Key: ${apiKey ? 'Set' : 'Missing'}`);
      this.logger.error(`Auth Domain: ${authDomain ? 'Set' : 'Missing'}`);
      this.logger.error(`Project ID: ${projectId ? 'Set' : 'Missing'}`);
      throw new Error(
        'Firebase configuration is incomplete. Check your .env file.',
      );
    }

    try {
      const firebaseConfig = {
        apiKey,
        authDomain,
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      };

      this.logger.log('Initializing Firebase client app...');
      this.firebaseClientApp = initializeApp(firebaseConfig);
      this.firebaseClientAuth = getAuth(this.firebaseClientApp);
      this.logger.log('Firebase client app initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing Firebase client app:', error);
      throw error;
    }
  }

  async register(createUserDto: CreateUserDto): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    try {
      // Crear usuario en Firebase Auth
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
      // Primero autenticar con Firebase Authentication
      this.logger.log(`Intentando autenticar al usuario: ${loginDto.email}`);
      const userCredential = await signInWithEmailAndPassword(
        this.firebaseClientAuth,
        loginDto.email,
        loginDto.password,
      );

      // Si llegamos aquí, la autenticación fue exitosa
      this.logger.log(`Usuario autenticado correctamente: ${loginDto.email}`);

      try {
        // Intentar encontrar el usuario en Firestore
        const firestoreUser = await this.usersService.findOne(
          userCredential.user.uid,
        );

        // Si el usuario existe en Firestore, generar tokens
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
        // Si el usuario no existe en Firestore pero sí en Firebase Auth,
        // crearlo automáticamente en Firestore
        if (error instanceof NotFoundException) {
          this.logger.log(
            `Usuario autenticado pero no encontrado en Firestore. Creando perfil...`,
          );

          const userEmail = userCredential.user.email;
          if (!userEmail) {
            throw new UnauthorizedException(
              'El usuario no tiene un correo electrónico válido',
            );
          }

          // Crear usuario en Firestore con datos básicos
          const newUser: CreateUserDto = {
            uid: userCredential.user.uid,
            email: userEmail,
            role: UserRole.USER, // Usar el enum en lugar de string literal
            createdAt: new Date(),
          };

          const createdUser = await this.usersService.create(newUser);
          const tokens = this.generateTokens(createdUser);

          return {
            user: createdUser,
            tokens,
          };
        }

        // Si es otro tipo de error, propagarlo
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
