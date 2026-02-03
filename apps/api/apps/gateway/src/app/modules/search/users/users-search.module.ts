import { Module } from '@nestjs/common';
import { UsersSearchController } from './users-search.controller';
import { UsersSearchService } from './users-search.service';
import { SupabaseModule } from '../../../common/supabase/supabase.module';
import { TypesenseModule } from '../../../common/typesense/typesense.module';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [UsersSearchController],
  providers: [UsersSearchService],
})
export class UsersSearchModule {}
