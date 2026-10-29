import { describe, it, expect } from 'bun:test';
import {
  mediaSlug,
  moviePath,
  personPath,
  tvEpisodePath,
  tvSeasonPath,
  tvSeriesPath,
} from '@libs/db/utils/media-path';
import { TvSeriesMinimalDto } from '../app/tv-series/dto/tv-series.dto';
import { PersonCompactDto } from '../app/persons/dto/persons.dto';
import { PlaylistItemWithMovieDto } from '../app/playlists/items/playlist-items.dto';
import { parseResponseDto } from './parse-response-dto';
import { instanceToPlain } from 'class-transformer';
import { MovieMetadataDto } from '../app/movies/metadata/movie-metadata.dto';
import { PersonMetadataDto } from '../app/persons/metadata/person-metadata.dto';
import { TvSeriesMetadataDto } from '../app/tv-series/metadata/tv-series-metadata.dto';
import { TvSeasonCompactDto } from '../app/tv-series/seasons/tv-seasons.dto';

describe('media paths', () => {
  it('uses a normalized localized title when one is available', () => {
    expect(mediaSlug(157336, 'À la folie !')).toBe('157336-a-la-folie');
    expect(moviePath(157336, 'Interstellar')).toBe('/film/157336-interstellar');
    expect(tvSeriesPath(1396, 'Breaking Bad')).toBe('/tv-series/1396-breaking-bad');
    expect(personPath(525, 'Christopher Nolan')).toBe('/person/525-christopher-nolan');
    expect(tvSeasonPath(1399, 1, 'Game of Thrones')).toBe(
      '/tv-series/1399-game-of-thrones/season/1',
    );
    expect(tvEpisodePath(1399, 1, 1, 'Game of Thrones')).toBe(
      '/tv-series/1399-game-of-thrones/season/1/episode/1',
    );
  });

  it('uses only the id when no title is available', () => {
    expect(mediaSlug(157336, null)).toBe('157336');
    expect(moviePath(157336, null)).toBe('/film/157336');
    expect(tvSeriesPath(1396, undefined)).toBe('/tv-series/1396');
    expect(tvSeasonPath(1399, 1)).toBe('/tv-series/1399/season/1');
    expect(tvEpisodePath(1399, 1, 1)).toBe('/tv-series/1399/season/1/episode/1');
    expect(personPath(525, null)).toBe('/person/525');
  });

  it('builds a compact person path without an URL from the database', () => {
    const person = parseResponseDto(PersonCompactDto, {
      id: 525,
      name: 'Christopher Nolan',
      gender: 2,
      profilePath: null,
    });

    expect(person).toMatchObject({
      id: 525,
      slug: '525-christopher-nolan',
      path: '/person/525-christopher-nolan',
      url: '/person/525-christopher-nolan',
    });
  });

  it('preserves the legacy URL in minimal TV series responses', () => {
    const series = parseResponseDto(TvSeriesMinimalDto, {
      id: 1396,
      name: 'Breaking Bad',
    });

    expect(series).toMatchObject({
      path: '/tv-series/1396-breaking-bad',
      url: '/tv-series/1396-breaking-bad',
    });
  });

  it('accepts a person with no gender', () => {
    expect(() =>
      parseResponseDto(PersonCompactDto, {
        id: 525,
        name: 'Christopher Nolan',
        gender: null,
        profilePath: null,
      }),
    ).not.toThrow();
  });

  it('builds paths for media nested in playlist items', () => {
    const item = parseResponseDto(PlaylistItemWithMovieDto, {
      id: 1,
      playlistId: 2,
      userId: 'user-id',
      comment: null,
      rank: '0|i0000r:',
      mediaId: 157336,
      type: 'movie',
      createdAt: '2024-01-30T12:00:00Z',
      updatedAt: '2024-01-30T12:00:00Z',
      media: {
        id: 157336,
        title: 'Interstellar',
        posterPath: null,
        backdropPath: null,
        directors: [],
        releaseDate: null,
        voteAverage: 8.4,
        voteCount: 1,
        popularity: 1,
        genres: [],
        followerAvgRating: null,
      },
    });

    expect(item.media).toMatchObject({
      slug: '157336-interstellar',
      path: '/film/157336-interstellar',
      url: '/film/157336-interstellar',
    });
  });

  // Postgres returns `bigint` columns as strings, so a tv series id reaches the slug as
  // `'342719183'` where a movie id reaches it as a number.
  it('accepts the numeric string a bigint column returns', () => {
    expect(mediaSlug('342719183', 'Game of Thrones')).toBe('342719183-game-of-thrones');
    expect(mediaSlug('342719183', null)).toBe('342719183');
  });

  it('refuses an id it cannot build a slug from', () => {
    const missing = undefined as unknown as number;

    expect(() => mediaSlug(missing, 'Interstellar')).toThrow(TypeError);
    expect(() => moviePath(missing, 'Interstellar')).toThrow(TypeError);
    expect(() => personPath(missing, 'Christopher Nolan')).toThrow(TypeError);
    expect(() => mediaSlug('', 'Interstellar')).toThrow(TypeError);
    expect(() => mediaSlug('not-an-id', 'Interstellar')).toThrow(TypeError);
  });
});

/*
 * A global ClassSerializerInterceptor re-runs every `@Transform` on the way out, with the
 * built instance as `obj` instead of the database row. Asserting the DTO -- which is all
 * the service specs do -- passes while the client receives `/film/undefined`, so these
 * assert what `instanceToPlain` produces: the response as it leaves the API.
 */
describe('derived paths through the outbound serializer', () => {
  it('keeps the slug of a movie alternate', () => {
    const metadata = parseResponseDto(MovieMetadataDto, {
      alternates: [
        { locale: 'fr-FR', id: 550, title: 'Le Fight Club', originalTitle: 'Fight Club' },
      ],
    });

    expect(instanceToPlain(metadata)).toEqual({
      alternates: [{ locale: 'fr-FR', slug: '550-le-fight-club', path: '/film/550-le-fight-club' }],
    });
  });

  it('keeps the slug of a person alternate', () => {
    const metadata = parseResponseDto(PersonMetadataDto, {
      alternates: [{ locale: 'fr-FR', id: 525, name: 'Christopher Nolan' }],
    });

    expect(instanceToPlain(metadata)).toEqual({
      alternates: [
        { locale: 'fr-FR', slug: '525-christopher-nolan', path: '/person/525-christopher-nolan' },
      ],
    });
  });

  it('keeps the slug of a TV series alternate', () => {
    const metadata = parseResponseDto(TvSeriesMetadataDto, {
      alternates: [
        { locale: 'fr-FR', id: 1399, name: 'Le Trone de fer', originalName: 'Game of Thrones' },
      ],
    });

    expect(instanceToPlain(metadata)).toEqual({
      alternates: [
        { locale: 'fr-FR', slug: '1399-le-trone-de-fer', path: '/tv-series/1399-le-trone-de-fer' },
      ],
    });
  });

  // Same shape, one step subtler: `tvSeriesName` feeds the path but is never exposed, so
  // the outbound pass rebuilt the path without it -- no `undefined` in sight, just a URL
  // the series page itself canonicalises away from.
  it('keeps the series slug in a season path', () => {
    const season = parseResponseDto(TvSeasonCompactDto, {
      id: 3624,
      tvSeriesId: 1399,
      seasonNumber: 1,
      posterPath: null,
      episodeCount: 10,
      voteAverage: 8.4,
      voteCount: 0,
      tvSeriesName: 'Game of Thrones',
    });

    expect(instanceToPlain(season)).toMatchObject({
      path: '/tv-series/1399-game-of-thrones/season/1',
    });
  });
});
