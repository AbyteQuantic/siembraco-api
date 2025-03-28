import { Module } from '@nestjs/common';
import { LogoService } from './logo.service';

@Module({
  providers: [LogoService],
  exports: [LogoService],
})
export class LogoModule {}
