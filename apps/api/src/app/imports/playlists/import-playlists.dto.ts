import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { importMatchStatusEnum } from '@libs/db/schemas';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../common/dto/cursor-pagination.dto';

@ApiSchema({ name: 'ImportJobPlaylist' })
export class ImportJobPlaylistDto {
  @ApiProperty() @Expose() id!: number;
  @ApiProperty() @Expose() title!: string;
  @ApiProperty({ nullable: true }) @Expose() description!: string | null;

  @ApiProperty({ enum: importMatchStatusEnum.enumValues })
  @Expose()
  matchStatus!: (typeof importMatchStatusEnum.enumValues)[number];

  constructor(data: ImportJobPlaylistDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'PatchImportJobPlaylist' })
export class PatchImportJobPlaylistDto {
  @ApiPropertyOptional({
    enum: ['skipped', 'matched'],
    description: '"skipped" excludes the whole playlist from validate(). "matched" restores it.',
  })
  @IsOptional()
  @IsIn(['skipped', 'matched'])
  matchStatus?: 'skipped' | 'matched';
}

@ApiSchema({ name: 'ListPaginatedImportPlaylists' })
export class ListPaginatedImportPlaylistsDto extends PaginatedResponseDto<ImportJobPlaylistDto> {
  @ApiProperty({ type: () => [ImportJobPlaylistDto] })
  @Type(() => ImportJobPlaylistDto)
  data!: ImportJobPlaylistDto[];

  constructor(partial: Partial<ListPaginatedImportPlaylistsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteImportPlaylists' })
export class ListInfiniteImportPlaylistsDto extends CursorPaginatedResponseDto<ImportJobPlaylistDto> {
  @ApiProperty({ type: () => [ImportJobPlaylistDto] })
  @Type(() => ImportJobPlaylistDto)
  data!: ImportJobPlaylistDto[];

  constructor(partial: Partial<ListInfiniteImportPlaylistsDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
