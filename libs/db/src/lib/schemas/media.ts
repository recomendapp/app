import { sql } from 'drizzle-orm';
import { bigint, text, doublePrecision, pgMaterializedView } from 'drizzle-orm/pg-core';

export const mediaMostPopular = pgMaterializedView('media_most_popular', {
	mediaId: bigint('media_id', { mode: 'number' }).notNull(),
	type: text('type'),
	popularity: doublePrecision('popularity'),
}).as(sql`
	SELECT id AS media_id, 'movie' AS type, popularity 
	FROM tmdb_movie
	UNION ALL
	SELECT id AS media_id, 'tv_series' AS type, popularity 
	FROM tmdb_tv_series
`);