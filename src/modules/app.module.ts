import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule, AuthModule, SearchModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
