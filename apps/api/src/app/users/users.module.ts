import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SharedWorkerModule } from '@shared/worker';
import { UserMoviesModule } from './movies/user-movies.module';
import { UserPlaylistsModule } from './playlists/user-playlists.module';
import { UserBookmarksModule } from './bookmarks/user-bookmarks.module';
import { UserFollowersModule } from './followers/user-followers.module';
import { UserFollowingModule } from './following/user-following.module';

@Module({
  imports: [
    SharedWorkerModule,
    UserMoviesModule,
    UserPlaylistsModule,
    UserBookmarksModule,
    UserFollowersModule,
    UserFollowingModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
