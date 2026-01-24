import { Module } from '@nestjs/common';
import { TvSeriesSearchController } from './tv-series-search.controller';
import { TvSeriesSearchService } from './tv-series-search.service';
import { SupabaseModule } from 'apps/gateway/src/common/supabase/supabase.module';
import { TypesenseModule } from 'apps/gateway/src/common/typesense/typesense.module';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [TvSeriesSearchController],
  providers: [TvSeriesSearchService],
})
export class TvSeriesSearchModule {}
