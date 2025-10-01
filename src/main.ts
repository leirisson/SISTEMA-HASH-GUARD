import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Configuração Swagger
  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'HashGuard API')
    .setDescription(
      process.env.SWAGGER_DESCRIPTION || 
      'Sistema de preservação e verificação de evidências digitais'
    )
    .setVersion(process.env.SWAGGER_VERSION || '1.0.0')
    .addTag('evidence', 'Operações de evidências digitais')
    .addTag('verification', 'Verificação de integridade e autenticidade')
    .addTag('custody', 'Cadeia de custódia')
    .addTag('signature', 'Assinatura digital PGP')
    .addTag('timestamp', 'Timestamp OpenTimestamps')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(process.env.SWAGGER_PATH || 'api/docs', app, document);

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'HashGuard API',
    });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 HashGuard API rodando na porta ${port}`);
  console.log(`📚 Documentação disponível em: http://localhost:${port}/${process.env.SWAGGER_PATH || 'api/docs'}`);
}

bootstrap();