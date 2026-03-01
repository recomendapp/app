import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { apiSchema, EnvModule } from '@libs/env';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { UsersModule } from './users/users.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { DrizzleModule } from '../common/modules/drizzle.module';
import { PersonsModule } from './persons/persons.module';
import { TvSeriesModule } from './tv-series/tv-series.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { RecosModule } from './recos/recos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EnvModule.forRoot(apiSchema),
    DrizzleModule,
    AuthModule,
    HealthModule,
    UsersModule,
    BookmarksModule,
    RecosModule,
    PlaylistsModule,
    MoviesModule,
    TvSeriesModule,
    PersonsModule,
    ReviewsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
