import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Initializes and starts the NestJS application with CORS enabled and Swagger documentation.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Chateroo API')
    .setDescription('Chat API with multiple AI providers support including streaming capabilities')
    .setVersion('1.0')
    .addTag('chat', 'Chat endpoints for sending messages to AI providers')
    .addTag('providers', 'Endpoints for managing AI providers and models')
    .addTag('app', 'Application health and status endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Chateroo API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger Documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
void bootstrap();
