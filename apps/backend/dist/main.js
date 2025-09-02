"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Chateroo API')
        .setDescription('Chat API with multiple AI providers support including streaming capabilities')
        .setVersion('1.0')
        .addTag('chat', 'Chat endpoints for sending messages to AI providers')
        .addTag('providers', 'Endpoints for managing AI providers and models')
        .addTag('app', 'Application health and status endpoints')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Chateroo API Documentation',
        customfavIcon: '/favicon.ico',
        customCss: '.swagger-ui .topbar { display: none }',
    });
    await app.listen(process.env.PORT ?? 3000);
    console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
    console.log(`📚 Swagger Documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
void bootstrap();
//# sourceMappingURL=main.js.map