import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { WebhookRevenuecatService } from './webhook-revenuecat.service';
import { RevenueCatGuard } from './webhook-revenuecat.guard';

@ApiTags('Webhooks')
@Controller({
  path: 'webhooks/revenuecat',
  version: '1',
})
export class WebhookRevenuecatController {
  constructor(private readonly rcService: WebhookRevenuecatService) {}

  @Post()
  @UseGuards(RevenueCatGuard)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Body() body: any
  ) {
    return this.rcService.handleEvent(body.event);
  }
}