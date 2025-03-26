import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { serviceAccount } from './firebase.config';

@Injectable()
export class FirebaseService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    this.firestore = admin.firestore();
  }

  getFirestoreInstance() {
    return this.firestore;
  }

  getAuthInstance() {
    return admin.auth();
  }
}
