import { 
  ApiProperty, 
  ApiPropertyOptional, 
  ApiSchema, 
  IntersectionType, 
  getSchemaPath, 
  ApiExtraModels, 
  OmitType
} from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PaginatedResponseDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CursorPaginatedResponseDto, CursorPaginationQueryDto } from '../../common/dto/cursor-pagination.dto';
import { feedTypeEnum } from '@libs/db/schemas';
import { UserSummaryDto } from '../users/dto/users.dto';
import { PlaylistDto } from '../playlists/dto/playlists.dto';
import { LogMovieWithMovieDto } from '../movies/logs/log-movie.dto';
import { LogTvSeriesWithTvSeriesDto } from '../tv-series/logs/tv-series-logs.dto';
import { IsOptional, IsString } from 'class-validator';
import { ReviewMovieWithAuthorMovieDto } from '../reviews/movie/dto/reviews-movie.dto';
import { ReviewTvSeriesWithAuthorTvSeriesDto } from '../reviews/tv-series/dto/review-tv-series.dto';
import { MovieSummaryDto } from '../movies/dto/movies.dto';
import { TvSeriesSummaryDto } from '../tv-series/dto/tv-series.dto';

class BaseFeedItemDto {
  @ApiProperty({ example: 42 })
  @Expose()
  id!: number;

  @ApiProperty({ example: '2024-01-30T12:00:00Z' })
  @Expose()
  createdAt!: string;

  @ApiProperty({ type: () => UserSummaryDto })
  @Expose()
  @Type(() => UserSummaryDto)
  author!: UserSummaryDto;

  @ApiProperty({ description: 'The id of the activity' })
  @Expose()
  activityId!: number;

  @ApiProperty({ enum: feedTypeEnum.enumValues })
  @Expose()
  activityType!: typeof feedTypeEnum.enumValues[number];
}

@ApiSchema({ name: 'FeedLogMovieContent' })
export class FeedLogMovieContentDto extends OmitType(LogMovieWithMovieDto, ['movie']) {
  @ApiProperty({ type: () => MovieSummaryDto })
  @Expose()
  @Type(() => MovieSummaryDto)
  movie!: MovieSummaryDto;
}

@ApiSchema({ name: 'FeedLogTvSeriesContent' })
export class FeedLogTvSeriesContentDto extends OmitType(LogTvSeriesWithTvSeriesDto, ['tvSeries']) {
  @ApiProperty({ type: () => TvSeriesSummaryDto })
  @Expose()
  @Type(() => TvSeriesSummaryDto)
  tvSeries!: TvSeriesSummaryDto;
}

@ApiSchema({ name: 'FeedReviewMovieLikeContent' })
export class FeedReviewMovieLikeContentDto extends OmitType(ReviewMovieWithAuthorMovieDto, ['movie']) {
  @ApiProperty({ type: () => MovieSummaryDto })
  @Expose()
  @Type(() => MovieSummaryDto)
  movie!: MovieSummaryDto;
}

@ApiSchema({ name: 'FeedReviewTvSeriesLikeContent' })
export class FeedReviewTvSeriesLikeContentDto extends OmitType(ReviewTvSeriesWithAuthorTvSeriesDto, ['tvSeries']) {
  @ApiProperty({ type: () => TvSeriesSummaryDto })
  @Expose()
  @Type(() => TvSeriesSummaryDto)
  tvSeries!: TvSeriesSummaryDto;
}

@ApiSchema({ name: 'FeedItemLogMovie' })
export class FeedItemLogMovieDto extends BaseFeedItemDto {
  @ApiProperty({ enum: ['log_movie'] as const })
  @Expose()
  activityType!: 'log_movie';

  @ApiProperty({ type: () => FeedLogMovieContentDto })
  @Expose()
  @Type(() => FeedLogMovieContentDto)
  content!: FeedLogMovieContentDto;
}

@ApiSchema({ name: 'FeedItemLogTvSeries' })
export class FeedItemLogTvSeriesDto extends BaseFeedItemDto {
  @ApiProperty({ enum: ['log_tv_series'] as const })
  @Expose()
  activityType!: 'log_tv_series';

  @ApiProperty({ type: () => FeedLogTvSeriesContentDto })
  @Expose()
  @Type(() => FeedLogTvSeriesContentDto)
  content!: FeedLogTvSeriesContentDto;
}

@ApiSchema({ name: 'FeedItemPlaylistLike' })
export class FeedItemPlaylistLikeDto extends BaseFeedItemDto {
  @ApiProperty({ enum: ['playlist_like'] as const })
  @Expose()
  activityType!: 'playlist_like';

  @ApiProperty({ type: () => PlaylistDto })
  @Expose()
  @Type(() => PlaylistDto)
  content!: PlaylistDto;
}

@ApiSchema({ name: 'FeedItemReviewMovieLike' })
export class FeedItemReviewMovieLikeDto extends BaseFeedItemDto {
  @ApiProperty({ enum: ['review_movie_like'] as const })
  @Expose()
  activityType!: 'review_movie_like';

  @ApiProperty({ type: () => FeedReviewMovieLikeContentDto })
  @Expose()
  @Type(() => FeedReviewMovieLikeContentDto)
  content!: FeedReviewMovieLikeContentDto;
}

@ApiSchema({ name: 'FeedItemReviewTvSeriesLike' })
export class FeedItemReviewTvSeriesLikeDto extends BaseFeedItemDto {
  @ApiProperty({ enum: ['review_tv_series_like'] as const })
  @Expose()
  activityType!: 'review_tv_series_like';

  @ApiProperty({ type: () => FeedReviewTvSeriesLikeContentDto })
  @Expose()
  @Type(() => FeedReviewTvSeriesLikeContentDto)
  content!: FeedReviewTvSeriesLikeContentDto;
}

export type FeedItemUnion = 
  | FeedItemLogMovieDto 
  | FeedItemLogTvSeriesDto 
  | FeedItemPlaylistLikeDto
  | FeedItemReviewMovieLikeDto
  | FeedItemReviewTvSeriesLikeDto;


export class BaseListFeedQueryDto {
  @ApiPropertyOptional({
    description: 'Filter feed by activity type',
    enum: feedTypeEnum.enumValues,
  })
  @IsOptional()
  @IsString()
  activity_type?: typeof feedTypeEnum.enumValues[number];

  @ApiPropertyOptional({ description: 'Filter feed for a specific user ID' })
  @IsOptional()
  @IsString()
  targetUserId?: string;
}

@ApiSchema({ name: 'ListPaginatedFeedQuery' })
export class ListPaginatedFeedQueryDto extends IntersectionType(
  BaseListFeedQueryDto,
  PaginationQueryDto
) {}

@ApiSchema({ name: 'ListInfiniteFeedQuery' })
export class ListInfiniteFeedQueryDto extends IntersectionType(
  BaseListFeedQueryDto,
  CursorPaginationQueryDto
) {}

@ApiExtraModels(
  FeedItemLogMovieDto,
  FeedItemLogTvSeriesDto,
  FeedItemPlaylistLikeDto,
  FeedItemReviewMovieLikeDto,
  FeedItemReviewTvSeriesLikeDto
)
@ApiSchema({ name: 'ListPaginatedFeed' })
export class ListPaginatedFeedDto extends PaginatedResponseDto<FeedItemUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(FeedItemLogMovieDto) },
        { $ref: getSchemaPath(FeedItemLogTvSeriesDto) },
        { $ref: getSchemaPath(FeedItemPlaylistLikeDto) },
        { $ref: getSchemaPath(FeedItemReviewMovieLikeDto) },
        { $ref: getSchemaPath(FeedItemReviewTvSeriesLikeDto) },
      ],
      discriminator: {
        propertyName: 'activityType',
        mapping: {
          log_movie: getSchemaPath(FeedItemLogMovieDto),
          log_tv_series: getSchemaPath(FeedItemLogTvSeriesDto),
          playlist_like: getSchemaPath(FeedItemPlaylistLikeDto),
          review_movie_like: getSchemaPath(FeedItemReviewMovieLikeDto),
          review_tv_series_like: getSchemaPath(FeedItemReviewTvSeriesLikeDto),
        },
      },
    },
  })
  @Type(() => BaseFeedItemDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'activityType',
      subTypes: [
        { value: FeedItemLogMovieDto, name: 'log_movie' },
        { value: FeedItemLogTvSeriesDto, name: 'log_tv_series' },
        { value: FeedItemPlaylistLikeDto, name: 'playlist_like' },
        { value: FeedItemReviewMovieLikeDto, name: 'review_movie_like' },
        { value: FeedItemReviewTvSeriesLikeDto, name: 'review_tv_series_like' },
      ],
    },
  })
  data!: FeedItemUnion[];

  constructor(partial: Partial<ListPaginatedFeedDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

@ApiExtraModels(
  FeedItemLogMovieDto,
  FeedItemLogTvSeriesDto,
  FeedItemPlaylistLikeDto,
  FeedItemReviewMovieLikeDto,
  FeedItemReviewTvSeriesLikeDto
)
@ApiSchema({ name: 'ListInfiniteFeed' })
export class ListInfiniteFeedDto extends CursorPaginatedResponseDto<FeedItemUnion> {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(FeedItemLogMovieDto) },
        { $ref: getSchemaPath(FeedItemLogTvSeriesDto) },
        { $ref: getSchemaPath(FeedItemPlaylistLikeDto) },
        { $ref: getSchemaPath(FeedItemReviewMovieLikeDto) },
        { $ref: getSchemaPath(FeedItemReviewTvSeriesLikeDto) },
      ],
      discriminator: {
        propertyName: 'activityType',
        mapping: {
          log_movie: getSchemaPath(FeedItemLogMovieDto),
          log_tv_series: getSchemaPath(FeedItemLogTvSeriesDto),
          playlist_like: getSchemaPath(FeedItemPlaylistLikeDto),
          review_movie_like: getSchemaPath(FeedItemReviewMovieLikeDto),
          review_tv_series_like: getSchemaPath(FeedItemReviewTvSeriesLikeDto),
        },
      },
    },
  })
  @Type(() => BaseFeedItemDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'activityType',
      subTypes: [
        { value: FeedItemLogMovieDto, name: 'log_movie' },
        { value: FeedItemLogTvSeriesDto, name: 'log_tv_series' },
        { value: FeedItemPlaylistLikeDto, name: 'playlist_like' },
        { value: FeedItemReviewMovieLikeDto, name: 'review_movie_like' },
        { value: FeedItemReviewTvSeriesLikeDto, name: 'review_tv_series_like' },
      ],
    },
  })
  data!: FeedItemUnion[];

  constructor(partial: Partial<ListInfiniteFeedDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}