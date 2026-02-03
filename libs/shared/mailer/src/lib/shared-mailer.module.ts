import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MAILER_QUEUE } from './shared-mailer.constants';
import { MailerClient } from './shared-mailer.client';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MAILER_QUEUE,
    }),
  ],
  providers: [
    MailerClient,
  ],
  exports: [
    MailerClient,
  ],
})
export class MailerSharedModule {}