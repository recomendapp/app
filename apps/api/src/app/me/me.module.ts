import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { SharedWorkerModule } from '@shared/worker';
import { MeAvatarModule } from './avatar/me-avatar.module';
import { MePlaylistsFollowingModule } from './playlists/following/me-playlists-following.module';
import { MePushTokensModule } from './push-tokens/me-push-tokens.module';
import { MePinnedModule } from './pinned/me-pinned.module';

@Module({
  imports: [
    SharedWorkerModule,
    MeAvatarModule,
    MePushTokensModule,
    MePlaylistsFollowingModule,
    MePinnedModule,
  ],
  controllers: [MeController],
  providers: [MeService],
  exports: [MeService],
})
export class MeModule {}
