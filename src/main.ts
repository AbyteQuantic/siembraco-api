import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogoService } from './common/logo/logo.service';

async function bootstrap() {
  console.log('Iniciando aplicación...');
  console.log('Variables de entorno:');
  console.log('- PORT:', process.env.PORT);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log(
    '- FIREBASE_PROJECT_ID:',
    process.env.FIREBASE_PROJECT_ID ? 'Definido' : 'No definido',
  );
  console.log(
    '- FIREBASE_CLIENT_EMAIL:',
    process.env.FIREBASE_CLIENT_EMAIL ? 'Definido' : 'No definido',
  );

  try {
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT ?? 3000;

    // Habilitar CORS
    app.enableCors();

    console.log(`Iniciando servidor en puerto: ${port} (host: 0.0.0.0)`);
    await app.listen(port, '0.0.0.0');
    console.log(`¡Servidor iniciado correctamente en puerto: ${port}!`);

    const logoService = app.get(LogoService);
    console.log(logoService.getLogo());
    console.log(logoService.getStartupMessage(port));
  } catch (error) {
    console.error('Error durante la inicialización de la aplicación:', error);
    throw error;
  }
}

bootstrap().catch((err) => {
  console.error('Error fatal en bootstrap:', err);
  process.exit(1);
});
