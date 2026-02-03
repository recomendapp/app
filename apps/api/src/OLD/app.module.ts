import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '@libs/core';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';
import { ReviewsModule } from './reviews/reviews.module';
import { EnvModule } from '@libs/env';
import { AuthModule } from '../app/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EnvModule,
    DrizzleModule,
    AuthModule,
    HealthModule,
    SearchModule,
    ReviewsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
