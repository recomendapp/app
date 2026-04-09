import { ApiProperty, ApiPropertyOptional, ApiSchema, IntersectionType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';

export enum MovieImageType {
  POSTER = 'poster',
  BACKDROP = 'backdrop',
  LOGO = 'logo',
}

@ApiSchema({ name: 'MovieImage' })
export class MovieImageDto {
  @ApiProperty({ example: 12345 })
  @Expose()
  @IsInt()
  id!: number;

  @ApiProperty({ example: '/path/to/image.jpg' })
  @Expose()
  @IsString()
  filePath!: string;

  @ApiProperty({ enum: MovieImageType, example: MovieImageType.POSTER })
  @Expose()
  @IsEnum(MovieImageType)
  type!: string;

  @ApiProperty({ example: 1.778 })
  @Expose()
  aspectRatio!: number;

  @ApiProperty({ example: 1080 })
  @Expose()
  height!: number;

  @ApiProperty({ example: 1920 })
  @Expose()
  width!: number;

  @ApiProperty({ example: 8.5 })
  @Expose()
  voteAverage!: number;

  @ApiProperty({ example: 120 })
  @Expose()
  voteCount!: number;

  @ApiProperty({ example: 'en', nullable: true })
  @Expose()
  iso6391!: string | null;
}

export class BaseMovieImagesQueryDto {
  @ApiPropertyOptional({ enum: MovieImageType, description: 'Filter by image type' })
  @IsOptional()
  @IsEnum(MovieImageType)
  type?: MovieImageType;
}

@ApiSchema({ name: 'ListPaginatedMovieImagesQuery' })
export class ListPaginatedMovieImagesQueryDto extends IntersectionType(
  BaseMovieImagesQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteMovieImagesQuery' })
export class ListInfiniteMovieImagesQueryDto extends IntersectionType(
  BaseMovieImagesQueryDto,
  CursorPaginationQueryDto
) {}

@ApiSchema({ name: 'ListPaginatedMovieImages' })
export class ListPaginatedMovieImagesDto extends PaginatedResponseDto<MovieImageDto> {
  @ApiProperty({ type: () => [MovieImageDto] })
  @Type(() => MovieImageDto)
  data!: MovieImageDto[];

  constructor(partial: Partial<ListPaginatedMovieImagesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiSchema({ name: 'ListInfiniteMovieImages' })
export class ListInfiniteMovieImagesDto extends CursorPaginatedResponseDto<MovieImageDto> {
  @ApiProperty({ type: () => [MovieImageDto] })
  @Type(() => MovieImageDto)
  data!: MovieImageDto[];

  constructor(partial: Partial<ListInfiniteMovieImagesDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}