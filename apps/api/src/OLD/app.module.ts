import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';
import { ReviewsModule } from './reviews/reviews.module';
import { EnvModule } from '@libs/env';
import { AuthModule } from '../app/auth/auth.module';
import { DrizzleModule } from '../common/modules/drizzle.module';

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
