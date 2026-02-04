import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for the SvelteKit client with credentials
  const allowedOrigins = process.env.CLIENT_URL?.split(',').map(url => url.trim()) || ['http://localhost:5173'];
  
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

  // Configure logging based on environment
  if (process.env.NODE_ENV === 'production') {
    // In production: only log errors and warnings
    app.useLogger(['error', 'warn']);
  }
  // In development: use default (all log levels)
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
