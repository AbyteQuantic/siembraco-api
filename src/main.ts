import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogoService } from './common/logo/logo.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  await app.listen(port);

  const logoService = app.get(LogoService);
  console.log(logoService.getLogo());
  console.log(logoService.getStartupMessage(port));
}

bootstrap();
