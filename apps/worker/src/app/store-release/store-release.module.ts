import { Module } from '@nestjs/common';
import { GooglePlayModule } from '../../common/modules/google-play/google-play.module';
import { StoreReleaseService } from './store-release.service';

@Module({
  imports: [GooglePlayModule],
  providers: [StoreReleaseService],
})
export class StoreReleaseModule {}
