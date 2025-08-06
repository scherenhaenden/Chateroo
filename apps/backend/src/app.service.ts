import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Returns a greeting message.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
