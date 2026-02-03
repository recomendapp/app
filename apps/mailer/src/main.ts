import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MailerModule } from './app/mailer.module';
import { env } from './env';

async function bootstrap() {
  const app = await NestFactory.create(MailerModule);
  await app.listen(env.PORT);
  Logger.log(
    `Mailer service is running on: http://localhost:${env.PORT}/`,
  );
}

bootstrap();
