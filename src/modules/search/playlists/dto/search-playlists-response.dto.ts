import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { PaginatedResponseDto } from 'src/common/dto/pagination.dto';
import { PlaylistDto } from 'src/common/dto/playlist.dto';

@Exclude()
export class SearchPlaylistsResponseDto extends PaginatedResponseDto<PlaylistDto> {
  @ApiProperty({ type: [PlaylistDto] })
  @Type(() => PlaylistDto)
  declare data: PlaylistDto[];

  constructor(partial: Partial<SearchPlaylistsResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
