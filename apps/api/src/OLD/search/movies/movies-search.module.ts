import { Module } from '@nestjs/common';
import { MoviesSearchController } from './movies-search.controller';
import { MoviesSearchService } from './movies-search.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { TypesenseModule } from '@libs/core';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [MoviesSearchController],
  providers: [MoviesSearchService],
})
export class MoviesSearchModule {}
