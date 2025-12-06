import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import validateEnv from './utils/validateEnv';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

validateEnv();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
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

  const config = new DocumentBuilder()
    .setTitle('Recomend API')
    .setDescription('The API documentation for the Recomend application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT', // optional, arbitrary value for Swagger UI
        in: 'header',
        description: 'Enter JWT token',
      },
      'access-token', // This name is important for referencing this security scheme
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);

  app.getHttpAdapter().get('/api-docs-json', (req, res) => {
    res.send(document);
  });
  // SwaggerModule.setup('api-docs', app, document);
  app.use(
    '/api-docs',
    apiReference({
      url: '/api-docs-json',
      withFastify: true,
      theme: 'purple',
    }),
  );

  await app.listen({
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST ?? '0.0.0.0',
  });
}
bootstrap().catch((err) => {
  console.error('Error during app bootstrap:', err);
  process.exit(1);
});
