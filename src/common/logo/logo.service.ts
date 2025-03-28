// src/common/logo/logo.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class LogoService {
  private readonly colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
  };

  getLogo(): string {
    return `
${this.colors.green}
   ██████  █████                                                                                  
 ██████████████            █████  ██                      ██                       ████           
███████████████          ███   █████                      ██                     ███  ████        
█████████████            █████    ██ ███████ ████████████ ████████ ████████████████        ███████
█████████████              █████████ ███████████  ██   ██ ██    ██ ██  ███   ██████       ██    ██
███████████████          ███   █████ ██   ██ ██   ██   ██ ██   ███ ██  ███   ███████   ██████   ██
 ██████████████           ███████ ██  ██████ ██   ██   ██ ███████  ██    ███████  ██████   ██████ 
   ██████  █████                                                                                  

${this.colors.reset}                                                          
    `;
  }

  getStartupMessage(port: number | string): string {
    return `
${this.colors.green}
╔════════════════════════════════════════════════════════╗
║               🚀 Service SiembraCO started       ║
╠════════════════════════════════════════════════════════╣
║ URL local:    ${this.colors.yellow}http://localhost:${port}${this.colors.green}
║ URL red:      ${this.colors.yellow}http://[TU_IP_PUBLICA]:${port}${this.colors.green}
╚════════════════════════════════════════════════════════╝
${this.colors.reset}
`;
  }
}
