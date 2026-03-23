import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, ApiSchema, getSchemaPath } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

import { MovieCompactDto } from '../movies/dto/movies.dto';
import { TvSeriesCompactDto } from '../tv-series/dto/tv-series.dto';
import { PersonCompactDto } from '../persons/dto/persons.dto';
import { UserSummaryDto } from '../users/dto/users.dto';
import { PlaylistWithOwnerDto } from '../playlists/dto/playlists.dto';

@ApiSchema({ name: 'SearchQuery' })
export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string', example: 'nolan' })
  @IsString()
  q: string;

  @ApiPropertyOptional({ description: 'Results per category', example: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 5;
}

export class BestResultMovie {
  @ApiProperty({ enum: ['movie'] })
  type: 'movie';

  @ApiProperty({ type: () => MovieCompactDto })
  data: MovieCompactDto;
}

export class BestResultTvSeries {
  @ApiProperty({ enum: ['tv_series'] })
  type: 'tv_series';

  @ApiProperty({ type: () => TvSeriesCompactDto })
  data: TvSeriesCompactDto;
}

export class BestResultPerson {
  @ApiProperty({ enum: ['person'] })
  type: 'person';

  @ApiProperty({ type: () => PersonCompactDto })
  data: PersonCompactDto;
}

export class BestResultUser {
  @ApiProperty({ enum: ['user'] })
  type: 'user';

  @ApiProperty({ type: () => UserSummaryDto })
  data: UserSummaryDto;
}

export class BestResultPlaylist {
  @ApiProperty({ enum: ['playlist'] })
  type: 'playlist';

  @ApiProperty({ type: () => PlaylistWithOwnerDto })
  data: PlaylistWithOwnerDto;
}

export type BestResultUnion =
  | BestResultMovie
  | BestResultTvSeries
  | BestResultPerson
  | BestResultUser
  | BestResultPlaylist;

@ApiExtraModels(BestResultMovie, BestResultTvSeries, BestResultPerson, BestResultUser, BestResultPlaylist)
@ApiSchema({ name: 'SearchResponse' })
export class SearchResponseDto {
  @ApiPropertyOptional({ 
    description: 'Best overall result across all categories',
    oneOf: [
      { $ref: getSchemaPath(BestResultMovie) },
      { $ref: getSchemaPath(BestResultTvSeries) },
      { $ref: getSchemaPath(BestResultPerson) },
      { $ref: getSchemaPath(BestResultUser) },
      { $ref: getSchemaPath(BestResultPlaylist) },
    ],
    discriminator: {
      propertyName: 'type',
      mapping: {
        movie: getSchemaPath(BestResultMovie),
        tv_series: getSchemaPath(BestResultTvSeries),
        person: getSchemaPath(BestResultPerson),
        user: getSchemaPath(BestResultUser),
        playlist: getSchemaPath(BestResultPlaylist),
      },
    },
  })
  @Expose()
  best_result: BestResultUnion | null;

  @ApiProperty({ type: () => [MovieCompactDto] })
  @Expose()
  @Type(() => MovieCompactDto)
  movies: MovieCompactDto[];

  @ApiProperty({ type: () => [TvSeriesCompactDto] })
  @Expose()
  @Type(() => TvSeriesCompactDto)
  tv_series: TvSeriesCompactDto[];

  @ApiProperty({ type: () => [PersonCompactDto] })
  @Expose()
  @Type(() => PersonCompactDto)
  persons: PersonCompactDto[];

  @ApiProperty({ type: () => [UserSummaryDto] })
  @Expose()
  @Type(() => UserSummaryDto)
  users: UserSummaryDto[];

  @ApiProperty({ type: () => [PlaylistWithOwnerDto] })
  @Expose()
  @Type(() => PlaylistWithOwnerDto)
  playlists: PlaylistWithOwnerDto[];
}