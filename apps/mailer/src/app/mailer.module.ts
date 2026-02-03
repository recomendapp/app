import { Module } from '@nestjs/common';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { BullModule } from '@nestjs/bullmq';
import { MailerSharedModule } from '@shared/mailer';
import { env } from '../env';
import { MailProcessor } from './mailer.processor';
import { MailerService } from './mailer.service';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/assets/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    BullModule.forRoot({
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
    }),
    MailerSharedModule
  ],
  controllers: [],
  providers: [
    MailerService,
    MailProcessor,
  ],
})
export class MailerModule {}
