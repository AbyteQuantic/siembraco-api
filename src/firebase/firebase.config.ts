import * as admin from 'firebase-admin';

console.log('Inicializando Firebase...');
console.log(
  'FIREBASE_PROJECT_ID:',
  process.env.FIREBASE_PROJECT_ID ? 'Definido' : 'No definido',
);
console.log(
  'FIREBASE_CLIENT_EMAIL:',
  process.env.FIREBASE_CLIENT_EMAIL ? 'Definido' : 'No definido',
);
console.log(
  'FIREBASE_PRIVATE_KEY:',
  process.env.FIREBASE_PRIVATE_KEY
    ? 'Definido (longitud: ' +
        (process.env.FIREBASE_PRIVATE_KEY?.length || 0) +
        ')'
    : 'No definido',
);

let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Procesar la clave privada si es necesario
if (privateKey && !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
  console.log('Procesando FIREBASE_PRIVATE_KEY para reemplazar \\n');
  privateKey = privateKey.replace(/\\n/g, '\n');
}

try {
  // Verificar que tenemos los valores necesarios
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID no está definido');
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('FIREBASE_CLIENT_EMAIL no está definido');
  }
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY no está definido o es inválido');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
  // No lanzamos el error aquí para que la app pueda iniciar aunque Firebase falle
}

export default admin;
