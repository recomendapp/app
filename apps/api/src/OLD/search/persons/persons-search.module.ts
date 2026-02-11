import { Module } from '@nestjs/common';
import { PersonsSearchController } from './persons-search.controller';
import { PersonsSearchService } from './persons-search.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { TypesenseModule } from '../../../common/modules/typesense.module';


@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [PersonsSearchController],
  providers: [PersonsSearchService],
})
export class PersonsSearchModule {}
