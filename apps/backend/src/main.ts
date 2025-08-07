import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Initializes and starts the NestJS application.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
