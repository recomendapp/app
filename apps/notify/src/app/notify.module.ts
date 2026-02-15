import { Module } from '@nestjs/common';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { BullModule } from '@nestjs/bullmq';
import { NotifySharedModule } from '@shared/notify';
import { env } from '../env';
import { NotifyProcessor } from './notify.processor';
import { NotifyService } from './notify.service';
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
    NotifySharedModule
  ],
  controllers: [],
  providers: [
    NotifyService,
    NotifyProcessor,
  ],
})
export class NotifyModule {}
