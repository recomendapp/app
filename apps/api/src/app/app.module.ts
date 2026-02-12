import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { EnvModule } from '@libs/env';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { UsersModule } from './users/users.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { DrizzleModule } from '../common/modules/drizzle.module';
import { PersonsModule } from './persons/persons.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EnvModule,
    DrizzleModule,
    AuthModule,
    HealthModule,
    UsersModule,
    PlaylistsModule,
    MoviesModule,
    PersonsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
