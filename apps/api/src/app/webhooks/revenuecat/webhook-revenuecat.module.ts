import { Module } from '@nestjs/common';
import { WebhookRevenuecatService } from './webhook-revenuecat.service';
import { WebhookRevenuecatController } from './webhook-revenuecat.controller';

@Module({
  controllers: [WebhookRevenuecatController],
  providers: [WebhookRevenuecatService],
  exports: [WebhookRevenuecatService],
})
export class WebhookRevenuecatModule {}