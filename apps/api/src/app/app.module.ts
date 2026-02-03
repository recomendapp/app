import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '@libs/core';
import { HealthModule } from './health/health.module';
import { EnvModule } from '@libs/env';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EnvModule,
    DrizzleModule,
    AuthModule,
    HealthModule,
    UsersModule,
    MoviesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
