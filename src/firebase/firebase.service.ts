import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  public readonly db: FirebaseFirestore.Firestore;
  public readonly firestore: FirebaseFirestore.Firestore;
  public readonly auth: admin.auth.Auth;
  private readonly logger = new Logger(FirebaseService.name);

  constructor() {
    this.logger.log('Iniciando FirebaseService');

    try {
      // Si ya hay apps inicializadas, no hacemos nada
      if (admin.apps.length > 0) {
        this.logger.log('Firebase Admin ya está inicializado');
        this.db = admin.firestore();
        this.firestore = this.db;
        this.auth = admin.auth();
        return;
      }

      // Registramos variables para depuración
      this.logger.log(
        'FIREBASE_PROJECT_ID:',
        process.env.FIREBASE_PROJECT_ID ?? 'No definido',
      );

      // Configurar credenciales
      let appConfig: admin.AppOptions = {};

      // Para entorno de desarrollo local con variables .env
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log('Inicializando Firebase en modo desarrollo');

        // Procesar la clave privada para asegurar formato correcto
        let privateKey = process.env.FIREBASE_PRIVATE_KEY ?? '';

        // Si la clave tiene comillas al inicio y final, quitarlas
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }

        // Asegurar que los \n se convierten a saltos de línea reales
        privateKey = privateKey.replace(/\\n/g, '\n');

        if (
          process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          privateKey
        ) {
          try {
            appConfig = {
              credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
              }),
            };
            this.logger.log('Configuración completa para Firebase Admin');
          } catch (error) {
            this.logger.error(
              'Error al procesar credenciales de Firebase:',
              error,
            );
            // Fallback a configuración mínima
            appConfig = { projectId: process.env.FIREBASE_PROJECT_ID };
          }
        } else {
          // Configuración mínima
          this.logger.warn('Usando configuración mínima para Firebase');
          appConfig = { projectId: process.env.FIREBASE_PROJECT_ID };
        }
      }
      // Para entorno de producción con secretos de GCP
      else {
        this.logger.log('Inicializando Firebase en modo producción');

        // En producción, los secretos ya deberían estar correctamente formateados
        if (
          process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY
        ) {
          try {
            appConfig = {
              credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY,
              }),
            };
          } catch (error) {
            this.logger.error(
              'Error al procesar credenciales de Firebase en producción:',
              error,
            );
            // Fallback a configuración mínima
            appConfig = { projectId: process.env.FIREBASE_PROJECT_ID };
          }
        } else {
          // Configuración mínima para GCP
          this.logger.warn(
            'Usando configuración mínima para Firebase en producción',
          );
          appConfig = { projectId: process.env.FIREBASE_PROJECT_ID };
        }
      }

      // Inicializar Firebase Admin
      admin.initializeApp(appConfig);
      this.logger.log('Firebase Admin inicializado correctamente');
    } catch (error) {
      this.logger.error('Error al inicializar Firebase Admin:', error);
      throw error;
    }

    try {
      this.db = admin.firestore();
      this.firestore = this.db; // Asignar alias
      this.auth = admin.auth();
    } catch (error) {
      this.logger.error('Error al acceder a servicios de Firebase:', error);
      throw error;
    }
  }
}
