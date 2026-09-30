import { Module } from '@nestjs/common';
import { SystemModule } from '../../system/system.module';
import { AppStoreConnectModule } from '../../../common/modules/app-store-connect/app-store-connect.module';
import { WebhookAppStoreConnectService } from './webhook-app-store-connect.service';
import { WebhookAppStoreConnectController } from './webhook-app-store-connect.controller';

@Module({
  imports: [SystemModule, AppStoreConnectModule],
  controllers: [WebhookAppStoreConnectController],
  providers: [WebhookAppStoreConnectService],
})
export class WebhookAppStoreConnectModule {}
