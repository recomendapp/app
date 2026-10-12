import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE_SERVICE,
  type DrizzleService,
} from '../../../common/modules/drizzle/drizzle.module';
import { CacheService } from '../../../common/modules/cache/cache.service';
import { parseResponseDto } from '../../../utils/parse-response-dto';
import { MovieMetadataDto } from './movie-metadata.dto';

const CACHE_TTL_SECONDS = 3600;
const cacheKey = (movieId: number) => `movie:metadata:${movieId}`;

type AlternateRow = {
  locale: string;
  id: number;
  title: string | null;
  originalTitle: string | null;
};

@Injectable()
export class MovieMetadataService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Which locales genuinely translate this film, for the page's hreflang set.
   *
   * Deliberately not read through `tmdbMovieView`: that view resolves one locale at a
   * time and falls back (requested -> fallback -> default -> original language), so it
   * can never say whether the locale it was asked for had anything of its own. Here the
   * translation rows are read directly, because the absence of a translation is the
   * answer.
   *
   * Joined against `i18n.supported_languages` since TMDB carries translations for
   * locales the app does not serve, and an hreflang pointing at a URL that does not
   * exist is worse than no annotation.
   *
   * The set keys off `overview`, never `title`: TMDB leaves `title` empty when it equals
   * the original title, so requiring one drops `en-US` itself on any film with an English
   * original title -- which is most of them.
   */
  async get(movieId: number): Promise<MovieMetadataDto> {
    const cached = await this.cache.get<AlternateRow[]>(cacheKey(movieId));
    if (cached) return parseResponseDto(MovieMetadataDto, { alternates: cached });

    const result = await this.db.execute<AlternateRow>(sql`
      SELECT
        t.iso_639_1 || '-' || t.iso_3166_1 AS locale,
        m.id AS id,
        NULLIF(btrim(t.title), '') AS title,
        m.original_title AS "originalTitle"
      FROM tmdb.movie_translation t
      JOIN tmdb.movie m ON m.id = t.movie_id
      JOIN i18n.supported_languages sl
        ON sl.iso_639_1 = t.iso_639_1 AND sl.iso_3166_1 = t.iso_3166_1
      WHERE t.movie_id = ${movieId}
        AND length(btrim(coalesce(t.overview, ''))) > 0
      ORDER BY 1
    `);

    const rows = (Array.isArray(result) ? result : result.rows) as AlternateRow[];

    await this.cache.set(cacheKey(movieId), rows, CACHE_TTL_SECONDS);
    return parseResponseDto(MovieMetadataDto, { alternates: rows });
  }
}
