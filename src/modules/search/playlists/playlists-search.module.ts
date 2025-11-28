import { Module } from '@nestjs/common';
import { PlaylistsSearchController } from './playlists-search.controller';
import { PlaylistsSearchService } from './playlists-search.service';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { TypesenseModule } from 'src/common/typesense/typesense.module';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [PlaylistsSearchController],
  providers: [PlaylistsSearchService],
})
export class PlaylistsSearchModule {}
