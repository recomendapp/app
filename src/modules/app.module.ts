import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [HealthModule, AuthModule, SearchModule, ReviewsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
