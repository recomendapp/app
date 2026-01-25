import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './app/auth.module';
import { createGrpcOptions } from '@api/transport';
import { env } from './env';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(
    AuthModule,
    createGrpcOptions({
      packageName: 'auth',
      protoDomain: 'auth',
      protoFile: 'auth.proto',
      url: env.AUTH_GRPC_BIND,
    }),
  );
  await app.listen();
  Logger.log(`🚀 Auth microservice is running on gRPC: ${env.AUTH_GRPC_BIND}`);
}

bootstrap();
