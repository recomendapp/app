import { Module } from '@nestjs/common';
import { WebhookRevenuecatModule } from './revenuecat/webhook-revenuecat.module';

@Module({
  imports: [
    WebhookRevenuecatModule,
  ],
})
export class WebhooksModule {}
