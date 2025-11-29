import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Movie } from 'src/common/dto/movie.dto';
import { Person } from 'src/common/dto/person.dto';
import { Playlist } from 'src/common/dto/playlist.dto';
import { Profile } from 'src/common/dto/profile.dto';
import { TvSeries } from 'src/common/dto/tv-series.dto';
import { SearchMoviesResponse } from '../../movies/dto/search-movies-response.dto';
import { SearchTvSeriesResponse } from '../../tv-series/dto/search-tv-series-response.dto';
import { SearchPersonsResponse } from '../../persons/dto/search-persons-response.dto';
import { SearchUsersResponse } from '../../users/dto/search-users-response.dto';
import { SearchPlaylistsResponse } from '../../playlists/dto/search-playlists-response.dto';

// Define a union type for the data in BestResultItem for documentation purposes
type BestResultItemDataType = Movie | TvSeries | Person | Profile | Playlist;

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
      { $ref: '#/components/schemas/Movie' },
      { $ref: '#/components/schemas/TvSeries' },
      { $ref: '#/components/schemas/Person' },
      { $ref: '#/components/schemas/Profile' },
      { $ref: '#/components/schemas/Playlist' },
    ],
    description:
      'The data for the best result item. The actual schema depends on the `type` field.',
  })
  @Expose()
  // No @Type decorator is needed here for serialization if the `data` property
  // is already an instance of the correct DTO class (e.g., Movie, Person).
  // The ClassSerializerInterceptor will handle it correctly.
  data: BestResultItemDataType;
}

@Exclude()
export class SearchBestResultResponse {
  @ApiPropertyOptional({
    type: BestResultItem,
    description:
      'The single best result found across all types, based on a hybrid score of text match and popularity.',
  })
  @Expose()
  @Type(() => BestResultItem)
  bestResult?: BestResultItem | null;

  @ApiProperty({
    type: SearchMoviesResponse,
    description: 'Paginated movie search results',
  })
  @Expose()
  @Type(() => SearchMoviesResponse)
  declare movies: SearchMoviesResponse;

  @ApiProperty({
    type: SearchTvSeriesResponse,
    description: 'Paginated TV series search results',
  })
  @Expose()
  @Type(() => SearchTvSeriesResponse)
  declare tv_series: SearchTvSeriesResponse;

  @ApiProperty({
    type: SearchPersonsResponse,
    description: 'Paginated person search results',
  })
  @Expose()
  @Type(() => SearchPersonsResponse)
  declare persons: SearchPersonsResponse;

  @ApiProperty({
    type: SearchUsersResponse,
    description: 'Paginated user search results',
  })
  @Expose()
  @Type(() => SearchUsersResponse)
  declare users: SearchUsersResponse;

  @ApiProperty({
    type: SearchPlaylistsResponse,
    description: 'Paginated playlist search results',
  })
  @Expose()
  @Type(() => SearchPlaylistsResponse)
  declare playlists: SearchPlaylistsResponse;

  constructor(partial: Partial<SearchBestResultResponse>) {
    // This constructor will now correctly instantiate the nested DTOs
    // if the partial object contains plain objects for them.
    if (partial.movies) {
      this.movies = new SearchMoviesResponse(partial.movies);
    }
    if (partial.tv_series) {
      this.tv_series = new SearchTvSeriesResponse(partial.tv_series);
    }
    if (partial.persons) {
      this.persons = new SearchPersonsResponse(partial.persons);
    }
    if (partial.users) {
      this.users = new SearchUsersResponse(partial.users);
    }
    if (partial.playlists) {
      this.playlists = new SearchPlaylistsResponse(partial.playlists);
    }
    if (partial.bestResult) {
      this.bestResult = partial.bestResult;
    }
  }
}
