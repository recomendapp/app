import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE_SERVICE,
  type DrizzleService,
} from '../../../common/modules/drizzle/drizzle.module';
import { CacheService } from '../../../common/modules/cache/cache.service';
import { parseResponseDto } from '../../../utils/parse-response-dto';
import { TvSeriesMetadataDto } from './tv-series-metadata.dto';

const CACHE_TTL_SECONDS = 3600;
const cacheKey = (tvSeriesId: number) => `tv-series:metadata:${tvSeriesId}`;

type AlternateRow = {
  locale: string;
  id: number;
  name: string | null;
  originalName: string | null;
};

@Injectable()
export class TvSeriesMetadataService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Which locales genuinely translate this series, for the page's hreflang set. Same
   * shape and same reasoning as `MovieMetadataService`: keyed on `overview`, since
   * `name` is left empty when it matches the original name and would otherwise drop
   * the default locale.
   */
  async get(tvSeriesId: number): Promise<TvSeriesMetadataDto> {
    const cached = await this.cache.get<AlternateRow[]>(cacheKey(tvSeriesId));
    if (cached) return parseResponseDto(TvSeriesMetadataDto, { alternates: cached });

    const result = await this.db.execute<AlternateRow>(sql`
      SELECT
        t.iso_639_1 || '-' || t.iso_3166_1 AS locale,
        s.id AS id,
        NULLIF(btrim(t.name), '') AS name,
        s.original_name AS "originalName"
      FROM tmdb.tv_series_translation t
      JOIN tmdb.tv_series s ON s.id = t.tv_series_id
      JOIN i18n.supported_languages sl
        ON sl.iso_639_1 = t.iso_639_1 AND sl.iso_3166_1 = t.iso_3166_1
      WHERE t.tv_series_id = ${tvSeriesId}
        AND length(btrim(coalesce(t.overview, ''))) > 0
      ORDER BY 1
    `);

    const rows = (Array.isArray(result) ? result : result.rows) as AlternateRow[];

    await this.cache.set(cacheKey(tvSeriesId), rows, CACHE_TTL_SECONDS);
    return parseResponseDto(TvSeriesMetadataDto, { alternates: rows });
  }
}
