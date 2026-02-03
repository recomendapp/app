import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { PaginatedResponseDto } from '../../../../common/dto/pagination.dto';
import { Playlist } from '../../../../common/dto/playlist.dto';

@Exclude()
export class SearchPlaylistsResponse extends PaginatedResponseDto<Playlist> {
  @ApiProperty({ type: [Playlist] })
  @Type(() => Playlist)
  declare data: Playlist[];

  constructor(partial: Partial<SearchPlaylistsResponse>) {
    super(partial);
    Object.assign(this, partial);
  }
}
