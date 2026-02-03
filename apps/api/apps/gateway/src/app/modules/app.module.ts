import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TestAuthModule } from './test-auth/test-auth.module';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    SearchModule,
    ReviewsModule,
    TestAuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
