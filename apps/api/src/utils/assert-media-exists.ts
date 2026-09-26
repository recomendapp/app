import { NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { tmdbMovie, tmdbTvSeries } from '@libs/db/schemas';
import { DbTransaction } from '@libs/db';
import { DrizzleService } from '../common/modules/drizzle/drizzle.module';

export const assertMediaExists = async (
  db: DrizzleService | DbTransaction,
  type: 'movie' | 'tv_series',
  mediaId: number,
): Promise<void> => {
  if (type === 'movie') {
    const movie = await db.query.tmdbMovie.findFirst({
      where: eq(tmdbMovie.id, mediaId),
      columns: { id: true },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${mediaId} not found.`);
    }
  } else {
    const tvSeries = await db.query.tmdbTvSeries.findFirst({
      where: eq(tmdbTvSeries.id, mediaId),
      columns: { id: true },
    });

    if (!tvSeries) {
      throw new NotFoundException(`TV Series with ID ${mediaId} not found.`);
    }
  }
};
