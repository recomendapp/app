import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { WebhookAppStoreConnectService } from './webhook-app-store-connect.service';
import { AppStoreConnectGuard } from './webhook-app-store-connect.guard';

@ApiTags('Webhooks')
@Controller({
  path: 'webhooks/app-store-connect',
  version: '1',
})
export class WebhookAppStoreConnectController {
  constructor(private readonly service: WebhookAppStoreConnectService) {}

  @Post()
  @UseGuards(AppStoreConnectGuard)
  @ApiExcludeEndpoint()
  async handleWebhook(@Body() body: any) {
    return this.service.handleEvent(body?.data);
  }
}
