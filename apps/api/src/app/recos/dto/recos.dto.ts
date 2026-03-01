import { ApiSchema, ApiProperty, PartialType, PickType, getSchemaPath, ApiPropertyOptional, ApiExtraModels, IntersectionType, OmitType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { recoStatusEnum, recoTypeEnum } from '@libs/db/schemas';
import { MovieCompactDto } from '../../movies/dto/movies.dto';
import { TvSeriesCompactDto } from '../../tv-series/dto/tv-series.dto';
import { PaginatedResponseDto, PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination.dto';

export enum RecoSortBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  RANDOM = 'random',
}

export enum RecoType {
  MOVIE = 'movie',
  TV_SERIES = 'tv_series',
}

@ApiSchema({ name: 'Reco' })
export class RecoDto {
  @ApiProperty({ example: 42 })
  @Expose()
  @IsInt()
  id: number;

  @ApiProperty({ example: 'user-uuid-123' })
  @Expose()
  userId: string;

  @ApiProperty({ example: 'sender-uuid-456' })
  @Expose()
  senderId: string;

  @ApiProperty({ example: 'You gona like it', nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  comment: string | null;

  @ApiProperty({
      description: 'The status of the reco',
      enum: recoStatusEnum.enumValues, 
      example: recoStatusEnum.enumValues[0],
  })
  @Expose()
  @IsString()
  @IsIn(recoStatusEnum.enumValues, {
      message: `Status must be one of: ${recoStatusEnum.enumValues.join(', ')}`
  })
  status: typeof recoStatusEnum.enumValues[number];

  @ApiProperty({ example: 123456 })
  @Expose()
  @IsInt()
  mediaId: number;

  @ApiProperty({
      description: 'The type of the reco',
      enum: recoTypeEnum.enumValues, 
      example: recoTypeEnum.enumValues[0],
  })
  @Expose()
  @IsString()
  @IsIn(recoTypeEnum.enumValues, {
      message: `Type must be one of: ${recoTypeEnum.enumValues.join(', ')}`
  })
  type: typeof recoTypeEnum.enumValues[number];

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  createdAt: string;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  @IsDateString()
  updatedAt: string;

  constructor(data: RecoDto) {
    Object.assign(this, data);
  }
}

/* ---------------------------------- Types --------------------------------- */
@ApiSchema({ name: 'RecoWithMovie' })
export class RecoWithMovieDto extends RecoDto {
  @ApiProperty({ enum: ['movie'] as const })
  @Expose()
  type: 'movie';

  @ApiProperty({ type: () => MovieCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => MovieCompactDto)
  media: MovieCompactDto;
}

@ApiSchema({ name: 'RecoWithTvSeries' })
export class RecoWithTvSeriesDto extends RecoDto {
  @ApiProperty({ enum: ['tv_series'] as const })
  @Expose()
  type: 'tv_series';

  @ApiProperty({ type: () => TvSeriesCompactDto })
  @Expose()
  @ValidateNested()
  @Type(() => TvSeriesCompactDto)
  media: TvSeriesCompactDto;
}

export type RecoWithMediaUnion = RecoWithMovieDto | RecoWithTvSeriesDto;
/* -------------------------------------------------------------------------- */

@ApiSchema({ name: 'RecoSend' })
export class RecoSendDto extends PartialType(PickType(RecoDto, ['comment'] as const)) {
  @ApiProperty({ example: ['user-uuid-123', 'user-uuid-456'] })
  @Expose()
  @IsUUID('all', { each: true })
  userIds: string[];
}

@ApiSchema({ name: 'RecoSendResponse' })
export class RecoSendResponseDto extends PickType(RecoDto, ['mediaId', 'type', 'senderId', 'comment'] as const) {
    @ApiProperty({ example: 2, description: 'Number of recos requested to be sent (including those that failed)' })
    requested: number;

    @ApiProperty({ example: ['user-uuid-123', 'user-uuid-456'], description: 'List of user IDs the reco was sent to' })
    sent: string[];
}

@ApiSchema({ name: 'BaseListRecosQuery' })
export class BaseListRecosQueryDto {
    @ApiPropertyOptional({
      enum: recoStatusEnum.enumValues,
      default: 'active',
    })
    @IsOptional()
    @IsIn(recoStatusEnum.enumValues, {
      message: `Status must be one of: ${recoStatusEnum.enumValues.join(', ')}`
    })
    status: typeof recoStatusEnum.enumValues[number] = 'active';

    @ApiPropertyOptional({
      description: 'Filter recos by type',
      enum: recoTypeEnum.enumValues,
    })
    @IsOptional()
    @IsIn(recoTypeEnum.enumValues, {
      message: `Type must be one of: ${recoTypeEnum.enumValues.join(', ')}`
    })
    type?: typeof recoTypeEnum.enumValues[number];

    @ApiPropertyOptional({
        description: 'Field to sort recos by',
        default: RecoSortBy.CREATED_AT,
        example: RecoSortBy.CREATED_AT,
        enum: RecoSortBy,
    })
    @IsOptional()
    @IsEnum(RecoSortBy)
    sort_by: RecoSortBy = RecoSortBy.CREATED_AT;

    @ApiPropertyOptional({
        description: 'Sort order',
        default: SortOrder.ASC,
        example: SortOrder.ASC,
        enum: SortOrder,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sort_order: SortOrder = SortOrder.ASC;
}

@ApiSchema({ name: 'ListAllRecosQuery' })
export class ListAllRecosQueryDto extends BaseListRecosQueryDto {}

@ApiSchema({ name: 'ListPaginatedRecosQuery' })
export class ListPaginatedRecosQueryDto extends IntersectionType(
  BaseListRecosQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteRecosQuery' })
export class ListInfiniteRecosQueryDto extends IntersectionType(
  BaseListRecosQueryDto,
  CursorPaginationQueryDto
) {}

@ApiExtraModels(RecoWithMovieDto, RecoWithTvSeriesDto)
@ApiSchema({ name: 'ListPaginatedRecos' })
export class ListPaginatedRecosDto extends PaginatedResponseDto<RecoWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(RecoWithMovieDto) },
        { $ref: getSchemaPath(RecoWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(RecoWithMovieDto),
          tv_series: getSchemaPath(RecoWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => RecoDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: RecoWithMovieDto, name: 'movie' },
        { value: RecoWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data: RecoWithMediaUnion[];

  constructor(partial: Partial<ListPaginatedRecosDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiExtraModels(RecoWithMovieDto, RecoWithTvSeriesDto)
@ApiSchema({ name: 'ListInfiniteRecos'})
export class ListInfiniteRecosDto extends CursorPaginatedResponseDto<RecoWithMediaUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(RecoWithMovieDto) },
        { $ref: getSchemaPath(RecoWithTvSeriesDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          movie: getSchemaPath(RecoWithMovieDto),
          tv_series: getSchemaPath(RecoWithTvSeriesDto),
        },
      },
    },
  })
  @Type(() => RecoDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: RecoWithMovieDto, name: 'movie' },
        { value: RecoWithTvSeriesDto, name: 'tv_series' },
      ],
    },
  })
  data: RecoWithMediaUnion[];

  constructor(partial: Partial<ListInfiniteRecosDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}