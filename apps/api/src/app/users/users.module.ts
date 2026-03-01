import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SharedWorkerModule } from '@shared/worker';
import { UserMoviesModule } from './movies/user-movies.module';
import { UserPlaylistsModule } from './playlists/user-playlists.module';
import { UserBookmarksModule } from './bookmarks/user-bookmarks.module';
import { UserFollowersModule } from './followers/user-followers.module';
import { UserFollowingModule } from './following/user-following.module';
import { UserPushTokensModule } from './push-tokens/user-push-tokens.module';
import { UserFollowModule } from './follow/user-follow.module';
import { UserFollowRequestsModule } from './follow-requests/user-follow-requests.module';

@Module({
  imports: [
    SharedWorkerModule,
    UserMoviesModule,
    UserPlaylistsModule,
    UserBookmarksModule,
    UserFollowersModule,
    UserFollowingModule,
    UserPushTokensModule,
    UserFollowModule,
    UserFollowRequestsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
