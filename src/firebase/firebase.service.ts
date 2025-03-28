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

    // Verificamos variables de entorno para diagnóstico
    this.logger.log(
      'FIREBASE_PROJECT_ID:',
      process.env.FIREBASE_PROJECT_ID ? 'Definido' : 'No definido',
    );
    this.logger.log(
      'FIREBASE_CLIENT_EMAIL:',
      process.env.FIREBASE_CLIENT_EMAIL ? 'Definido' : 'No definido',
    );
    this.logger.log(
      'FIREBASE_PRIVATE_KEY:',
      process.env.FIREBASE_PRIVATE_KEY
        ? 'Definido (longitud: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')'
        : 'No definido',
    );

    try {
      // Configuramos Firebase Admin con las credenciales disponibles
      if (admin.apps.length === 0) {
        const config: admin.AppOptions = {};

        // Si tenemos el ID del proyecto, lo usamos para la configuración mínima
        if (process.env.FIREBASE_PROJECT_ID) {
          config.projectId = process.env.FIREBASE_PROJECT_ID;
        }

        // Si tenemos todas las credenciales, usamos la autenticación completa
        if (
          process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_CLIENT_EMAIL &&
          process.env.FIREBASE_PRIVATE_KEY
        ) {
          let privateKey = process.env.FIREBASE_PRIVATE_KEY;
          // Procesamos la clave privada si es necesario
          if (
            privateKey &&
            !privateKey.includes('-----BEGIN PRIVATE KEY-----')
          ) {
            privateKey = privateKey.replace(/\\n/g, '\n');
          }

          config.credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          });

          this.logger.log(
            'Inicializando Firebase Admin con credenciales completas',
          );
        } else {
          this.logger.warn(
            'Inicializando Firebase Admin con credenciales parciales',
          );
        }

        admin.initializeApp(config);
        this.logger.log('Firebase Admin inicializado correctamente');
      }
    } catch (error) {
      this.logger.error('Error al inicializar Firebase Admin:', error);
    }

    this.db = admin.firestore();
    this.firestore = this.db;
    this.auth = admin.auth();
  }
}
