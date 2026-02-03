import { Module } from '@nestjs/common';
import { TvSeriesSearchController } from './tv-series-search.controller';
import { TvSeriesSearchService } from './tv-series-search.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { TypesenseModule } from '@libs/core';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [TvSeriesSearchController],
  providers: [TvSeriesSearchService],
})
export class TvSeriesSearchModule {}
