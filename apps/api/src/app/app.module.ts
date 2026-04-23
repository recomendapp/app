import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SystemModule } from './system/system.module';
import { apiSchema, EnvModule } from '@libs/env';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { UsersModule } from './users/users.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { DrizzleModule } from '../common/modules/drizzle/drizzle.module';
import { PersonsModule } from './persons/persons.module';
import { TvSeriesModule } from './tv-series/tv-series.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { RecosModule } from './recos/recos.module';
import { MeModule } from './me/me.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeedModule } from './feed/feed.module';
import { SearchModule } from './search/search.module';
import { UiModule } from './ui/ui.module';
import { MediasModule } from './medias/medias.module';
import { BullModule } from '@nestjs/bullmq';
import { env } from '../env';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EnvModule.forRoot(apiSchema),
    BullModule.forRoot({
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
      },
    }),
    DrizzleModule,
    AuthModule,
    SystemModule,
    MeModule,
    UsersModule,
    BookmarksModule,
    RecosModule,
    PlaylistsModule,
    MoviesModule,
    TvSeriesModule,
    MediasModule,
    PersonsModule,
    ReviewsModule,
    FeedModule,
    SearchModule,
    UiModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
