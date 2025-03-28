// src/common/logger/request.logger.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, headers } = req;
    const userAgent = headers['user-agent'] || '';

    this.logger.debug(`➡️ ${method} ${originalUrl} - User Agent: ${userAgent}\nBody: ${JSON.stringify(body)}`);

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = headers['content-length'] || '0';

      this.logger.log(`⬅️ ${method} ${originalUrl} ${statusCode} ${contentLength}bytes - ${userAgent}`);
    });

    next();
  }
}
