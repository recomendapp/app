import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { importMatchStatusEnum, importResolutionEnum } from '@libs/db/schemas';
import { ImportJobReviewDto } from '../dto/imports.dto';
import { MovieCompactDto } from '../../movies/dto/movies.dto';
import { PaginatedResponseDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto } from '../../../common/dto/cursor-pagination.dto';

@ApiSchema({ name: 'ImportJobLogMovie' })
export class ImportJobLogMovieDto {
  @ApiProperty() @Expose() id!: number;
  @ApiProperty() @Expose() rawTitle!: string;
  @ApiProperty({ nullable: true }) @Expose() rawYear!: number | null;
  @ApiProperty({ nullable: true }) @Expose() movieId!: number | null;

  @ApiProperty({ enum: importMatchStatusEnum.enumValues })
  @Expose()
  matchStatus!: (typeof importMatchStatusEnum.enumValues)[number];

  @ApiProperty({ nullable: true }) @Expose() importedRating!: number | null;
  @ApiProperty() @Expose() importedIsLiked!: boolean;

  @ApiProperty({ enum: importResolutionEnum.enumValues, nullable: true })
  @Expose()
  resolution!: (typeof importResolutionEnum.enumValues)[number] | null;

  @ApiPropertyOptional({ type: () => ImportJobReviewDto, nullable: true })
  @Expose()
  @Type(() => ImportJobReviewDto)
  review?: ImportJobReviewDto | null;

  @ApiPropertyOptional({ type: () => MovieCompactDto, nullable: true })
  @Expose()
  @Type(() => MovieCompactDto)
  movie?: MovieCompactDto | null;

  constructor(data: ImportJobLogMovieDto) {
    Object.assign(this, data);
  }
}

@ApiSchema({ name: 'PatchImportJobLogMovie' })
export class PatchImportJobLogMovieDto {
  @ApiPropertyOptional({ description: 'Change the matched movie' })
  @IsOptional()
  @IsInt()
  movieId?: number;

  @ApiPropertyOptional({ enum: importResolutionEnum.enumValues })
  @IsOptional()
  @IsIn(importResolutionEnum.enumValues)
  resolution?: (typeof importResolutionEnum.enumValues)[number];

  @ApiPropertyOptional({
    enum: ['skipped', 'unmatched'],
    description:
      '"skipped" excludes the item from validate(). "unmatched" restores a skipped item without a match — ' +
      '"matched" is never set directly, it is always server-derived from providing movieId.',
  })
  @IsOptional()
  @IsIn(['skipped', 'unmatched'])
  matchStatus?: 'skipped' | 'unmatched';
}

@ApiSchema({ name: 'ListPaginatedImportLogMovies' })
export class ListPaginatedImportLogMoviesDto extends PaginatedResponseDto<ImportJobLogMovieDto> {
  @ApiProperty({ type: () => [ImportJobLogMovieDto] })
  @Type(() => ImportJobLogMovieDto)
  data!: ImportJobLogMovieDto[];

  constructor(partial: Partial<ListPaginatedImportLogMoviesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteImportLogMovies' })
export class ListInfiniteImportLogMoviesDto extends CursorPaginatedResponseDto<ImportJobLogMovieDto> {
  @ApiProperty({ type: () => [ImportJobLogMovieDto] })
  @Type(() => ImportJobLogMovieDto)
  data!: ImportJobLogMovieDto[];

  constructor(partial: Partial<ListInfiniteImportLogMoviesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
