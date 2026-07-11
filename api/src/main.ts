import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { seedAdmin } from './core/auth/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix for all routes except root
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  // Enable CORS for the React client with credentials
  const allowedOrigins = process.env.CLIENT_URL?.split(',').map((url) =>
    url.trim(),
  ) || ['http://localhost:5173'];

  // Only log CORS config in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Allowed CORS origins:', allowedOrigins);
    console.log('CLIENT_URL env variable:', process.env.CLIENT_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // Global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger/OpenAPI documentation setup
  const config = new DocumentBuilder()
    .setTitle('Patient Flow API')
    .setDescription('Healthcare workflow orchestration API')
    .setVersion('1.0')
    .addCookieAuth('session_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Configure logging based on environment
  if (process.env.NODE_ENV === 'production') {
    // In production: only log errors and warnings
    app.useLogger(['error', 'warn']);
  }
  // In development: use default (all log levels)

  // Seed admin user from ADMIN_EMAIL env var (idempotent)
  await seedAdmin();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
