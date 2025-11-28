import { Module } from '@nestjs/common';
import { PersonsSearchController } from './persons-search.controller';
import { PersonsSearchService } from './persons-search.service';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { TypesenseModule } from 'src/common/typesense/typesense.module';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [PersonsSearchController],
  providers: [PersonsSearchService],
})
export class PersonsSearchModule {}
