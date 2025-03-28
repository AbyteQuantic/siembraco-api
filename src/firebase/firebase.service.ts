import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService {
  public readonly firestore: admin.firestore.Firestore;
  public readonly auth: admin.auth.Auth;
  public readonly storage: admin.storage.Storage;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: this.configService.get<string>(
          'FIREBASE_STORAGE_BUCKET',
        ),
      });
    }

    this.firestore = admin.firestore();
    this.auth = admin.auth();
    this.storage = admin.storage();
  }
}
