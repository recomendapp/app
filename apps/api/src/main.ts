import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { env } from './env';
import { setupVersionedDocs } from './utils/docs';
import { API_VERSIONS } from './constants/api';

async function bootstrap() {
  const adapter = new FastifyAdapter();
  adapter.enableCors({
    origin: true,
    // origin: [env.WEB_APP_URL || 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  setupVersionedDocs(app, API_VERSIONS);

  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });
}
bootstrap().catch((err) => {
  console.error('Error during app bootstrap:', err);
  process.exit(1);
});
