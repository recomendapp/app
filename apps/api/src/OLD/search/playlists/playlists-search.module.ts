import { Module } from '@nestjs/common';
import { PlaylistsSearchController } from './playlists-search.controller';
import { PlaylistsSearchService } from './playlists-search.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { TypesenseModule } from '@libs/core';

@Module({
  imports: [SupabaseModule, TypesenseModule],
  controllers: [PlaylistsSearchController],
  providers: [PlaylistsSearchService],
})
export class PlaylistsSearchModule {}
