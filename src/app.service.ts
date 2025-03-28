import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to SiembraCO API,  this is an A_byte service';
  }
}
