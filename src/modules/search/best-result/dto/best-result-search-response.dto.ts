import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { MovieDto } from 'src/common/dto/movie.dto';
import { PersonDto } from 'src/common/dto/person.dto';
import { PlaylistDto } from 'src/common/dto/playlist.dto';
import { ProfileDto } from 'src/common/dto/profile.dto';
import { TvSeriesDto } from 'src/common/dto/tv-series.dto';
import { SearchMoviesResponseDto } from '../../movies/dto/search-movies-response.dto';
import { SearchTvSeriesResponseDto } from '../../tv-series/dto/search-tv-series-response.dto';
import { SearchPersonsResponseDto } from '../../persons/dto/search-persons-response.dto';
import { SearchUsersResponseDto } from '../../users/dto/search-users-response.dto';
import { SearchPlaylistsResponseDto } from '../../playlists/dto/search-playlists-response.dto';

// Define a union type for the data in BestResultItem for documentation purposes
type BestResultItemDataType =
  | MovieDto
  | TvSeriesDto
  | PersonDto
  | ProfileDto
  | PlaylistDto;

// DTO for a single best result item (e.g., movie, TV series, etc.)
@Exclude()
export class BestResultItem {
  @ApiProperty({
    enum: ['movie', 'tv_series', 'person', 'user', 'playlist'],
    description: 'The type of the best result item',
  })
  @Expose()
  type: 'movie' | 'tv_series' | 'person' | 'user' | 'playlist';

  @ApiProperty({
    oneOf: [
      { $ref: '#/components/schemas/MovieDto' },
      { $ref: '#/components/schemas/TvSeriesDto' },
      { $ref: '#/components/schemas/PersonDto' },
      { $ref: '#/components/schemas/ProfileDto' },
      { $ref: '#/components/schemas/PlaylistDto' },
    ],
    description:
      'The data for the best result item. The actual schema depends on the `type` field.',
  })
  @Expose()
  // No @Type decorator is needed here for serialization if the `data` property
  // is already an instance of the correct DTO class (e.g., MovieDto, PersonDto).
  // The ClassSerializerInterceptor will handle it correctly.
  data: BestResultItemDataType;
}

@Exclude()
export class BestResultSearchResponseDto {
  @ApiPropertyOptional({
    type: BestResultItem,
    description:
      'The single best result found across all types, based on a hybrid score of text match and popularity.',
  })
  @Expose()
  @Type(() => BestResultItem)
  bestResult?: BestResultItem | null;

  @ApiProperty({
    type: SearchMoviesResponseDto,
    description: 'Paginated movie search results',
  })
  @Expose()
  @Type(() => SearchMoviesResponseDto)
  declare movies: SearchMoviesResponseDto;

  @ApiProperty({
    type: SearchTvSeriesResponseDto,
    description: 'Paginated TV series search results',
  })
  @Expose()
  @Type(() => SearchTvSeriesResponseDto)
  declare tv_series: SearchTvSeriesResponseDto;

  @ApiProperty({
    type: SearchPersonsResponseDto,
    description: 'Paginated person search results',
  })
  @Expose()
  @Type(() => SearchPersonsResponseDto)
  declare persons: SearchPersonsResponseDto;

  @ApiProperty({
    type: SearchUsersResponseDto,
    description: 'Paginated user search results',
  })
  @Expose()
  @Type(() => SearchUsersResponseDto)
  declare users: SearchUsersResponseDto;

  @ApiProperty({
    type: SearchPlaylistsResponseDto,
    description: 'Paginated playlist search results',
  })
  @Expose()
  @Type(() => SearchPlaylistsResponseDto)
  declare playlists: SearchPlaylistsResponseDto;

  constructor(partial: Partial<BestResultSearchResponseDto>) {
    // This constructor will now correctly instantiate the nested DTOs
    // if the partial object contains plain objects for them.
    if (partial.movies) {
      this.movies = new SearchMoviesResponseDto(partial.movies);
    }
    if (partial.tv_series) {
      this.tv_series = new SearchTvSeriesResponseDto(partial.tv_series);
    }
    if (partial.persons) {
      this.persons = new SearchPersonsResponseDto(partial.persons);
    }
    if (partial.users) {
      this.users = new SearchUsersResponseDto(partial.users);
    }
    if (partial.playlists) {
      this.playlists = new SearchPlaylistsResponseDto(partial.playlists);
    }
    if (partial.bestResult) {
      this.bestResult = partial.bestResult;
    }
  }
}
