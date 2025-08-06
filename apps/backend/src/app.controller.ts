import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Retrieves a greeting message from the app service.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
