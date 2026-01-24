import { Module } from '@nestjs/common';
import { PersonsSearchController } from './persons-search.controller';
import { PersonsSearchService } from './persons-search.service';
import { SupabaseModule } from 'apps/gateway/src/common/supabase/supabase.module';
import { TypesenseModule } from 'apps/gateway/src/common/typesense/typesense.module';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [PersonsSearchController],
  providers: [PersonsSearchService],
})
export class PersonsSearchModule {}
