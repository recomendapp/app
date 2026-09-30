import { Module } from '@nestjs/common';
import { WebhookRevenuecatModule } from './revenuecat/webhook-revenuecat.module';
import { WebhookAppStoreConnectModule } from './app-store-connect/webhook-app-store-connect.module';

@Module({
  imports: [WebhookRevenuecatModule, WebhookAppStoreConnectModule],
})
export class WebhooksModule {}
