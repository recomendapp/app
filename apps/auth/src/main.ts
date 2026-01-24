import { NestFactory } from '@nestjs/core';

import { SharedService } from '@app/shared';

import { AuthModule } from './auth.module';
import { AUTH_PACKAGE_NAME } from '@app/shared/protos/__generated__';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  const sharedService = app.get(SharedService);

  app.connectMicroservice(
    sharedService.getGrpcOptions('auth', AUTH_PACKAGE_NAME),
  );

  await app.startAllMicroservices();
}
bootstrap().catch((err) => {
  console.error('Error starting Auth microservice:', err);
  process.exit(1);
});
