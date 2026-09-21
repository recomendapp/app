import {
  mediaSlug,
  moviePath,
  personPath,
  tvEpisodePath,
  tvSeasonPath,
  tvSeriesPath,
} from '@libs/db/utils/media-path';
import { PersonCompactDto } from '../app/persons/dto/persons.dto';
import { PlaylistItemWithMovieDto } from '../app/playlists/items/playlist-items.dto';
import { parseResponseDto } from './parse-response-dto';

describe('media paths', () => {
  it('uses a normalized localized title when one is available', () => {
    expect(mediaSlug(157336, 'À la folie !')).toBe('157336-a-la-folie');
    expect(moviePath(157336, 'Interstellar')).toBe('/film/157336-interstellar');
    expect(tvSeriesPath(1396, 'Breaking Bad')).toBe('/tv-series/1396-breaking-bad');
    expect(personPath(525, 'Christopher Nolan')).toBe('/person/525-christopher-nolan');
    expect(tvSeasonPath(1399, 1)).toBe('/tv-series/1399/season/1');
    expect(tvEpisodePath(1399, 1, 1)).toBe('/tv-series/1399/season/1/episode/1');
  });

  it('uses only the id when no title is available', () => {
    expect(mediaSlug(157336, null)).toBe('157336');
    expect(moviePath(157336, null)).toBe('/film/157336');
    expect(tvSeriesPath(1396, undefined)).toBe('/tv-series/1396');
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
    });
    expect(person).not.toHaveProperty('url');
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
    });
  });
});
