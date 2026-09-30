import { Global, Module } from '@nestjs/common';
import { AppStoreConnectService } from './app-store-connect.service';

@Global()
@Module({
  providers: [AppStoreConnectService],
  exports: [AppStoreConnectService],
})
export class AppStoreConnectModule {}
