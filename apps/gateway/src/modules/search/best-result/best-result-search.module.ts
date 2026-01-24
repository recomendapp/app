import { Module } from '@nestjs/common';
import { BestResultSearchController } from './best-result-search.controller';
import { BestResultSearchService } from './best-result-search.service';
import { SupabaseModule } from 'apps/gateway/src/common/supabase/supabase.module';
import { TypesenseModule } from 'apps/gateway/src/common/typesense/typesense.module';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [BestResultSearchController],
  providers: [BestResultSearchService],
})
export class BestResultSearchModule {}
