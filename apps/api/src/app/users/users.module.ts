import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserMoviesModule } from './movies/user-movies.module';
import { UserPlaylistsModule } from './playlists/user-playlists.module';
import { UserBookmarksModule } from './bookmarks/user-bookmarks.module';
import { UserFollowersModule } from './followers/user-followers.module';
import { UserFollowingModule } from './following/user-following.module';
import { UserPushTokensModule } from './push-tokens/user-push-tokens.module';
import { UserFollowModule } from './follow/user-follow.module';
import { UserFollowRequestsModule } from './follow-requests/user-follow-requests.module';
import { UserRecosModule } from './recos/user-recos.module';
import { UserTvSeriesModule } from './tv-series/user-tv-series.module';
import { UserFeedModule } from './feed/user-feed.module';

@Module({
  imports: [
    UserMoviesModule,
    UserTvSeriesModule,
    UserPlaylistsModule,
    UserBookmarksModule,
    UserFollowersModule,
    UserFollowingModule,
    UserPushTokensModule,
    UserFollowModule,
    UserFollowRequestsModule,
    UserRecosModule,
    UserFeedModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
