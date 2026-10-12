import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DRIZZLE_SERVICE,
  type DrizzleService,
} from '../../../common/modules/drizzle/drizzle.module';
import { CacheService } from '../../../common/modules/cache/cache.service';
import { parseResponseDto } from '../../../utils/parse-response-dto';
import { PersonMetadataDto } from './person-metadata.dto';

const CACHE_TTL_SECONDS = 3600;
const cacheKey = (personId: number) => `person:metadata:${personId}`;

type AlternateRow = { locale: string; id: number; name: string | null };

@Injectable()
export class PersonMetadataService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Which locales genuinely translate this person, for the page's hreflang set.
   *
   * Keyed on `biography`, the only translated field: the person page's description is
   * the biography, and `person_translation` has no name column at all.
   */
  async get(personId: number): Promise<PersonMetadataDto> {
    const cached = await this.cache.get<AlternateRow[]>(cacheKey(personId));
    if (cached) return parseResponseDto(PersonMetadataDto, { alternates: cached });

    const result = await this.db.execute<AlternateRow>(sql`
      SELECT
        t.iso_639_1 || '-' || t.iso_3166_1 AS locale,
        p.id AS id,
        p.name AS name
      FROM tmdb.person_translation t
      JOIN tmdb.person p ON p.id = t.person_id
      JOIN i18n.supported_languages sl
        ON sl.iso_639_1 = t.iso_639_1 AND sl.iso_3166_1 = t.iso_3166_1
      WHERE t.person_id = ${personId}
        AND length(btrim(coalesce(t.biography, ''))) > 0
      ORDER BY 1
    `);

    const rows = (Array.isArray(result) ? result : result.rows) as AlternateRow[];

    await this.cache.set(cacheKey(personId), rows, CACHE_TTL_SECONDS);
    return parseResponseDto(PersonMetadataDto, { alternates: rows });
  }
}
