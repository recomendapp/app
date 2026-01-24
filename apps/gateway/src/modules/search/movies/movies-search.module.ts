import { Module } from '@nestjs/common';
import { MoviesSearchController } from './movies-search.controller';
import { MoviesSearchService } from './movies-search.service';
import { SupabaseModule } from 'apps/gateway/src/common/supabase/supabase.module';
import { TypesenseModule } from 'apps/gateway/src/common/typesense/typesense.module';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [MoviesSearchController],
  providers: [MoviesSearchService],
})
export class MoviesSearchModule {}
