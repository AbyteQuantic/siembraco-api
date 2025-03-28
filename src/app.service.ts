import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to SiembraCO API, A_byte service auxpicied';
  }
}
