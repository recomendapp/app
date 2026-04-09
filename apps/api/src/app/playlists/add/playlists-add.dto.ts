import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { PlaylistItemDto } from '../items/playlist-items.dto';

@ApiSchema({ name: 'PlaylistsAddQuery' })
export class PlaylistsAddQueryDto extends PickType(PlaylistItemDto, ['comment'] as const) {
  @ApiProperty({
    description: 'IDs of the playlists to which the media item should be added',
    example: [10, 15, 22],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  playlistIds!: number[];
}