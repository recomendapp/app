import { eq, inArray, sql } from 'drizzle-orm';
import { DbClient } from '../client';
import { explore, exploreItem } from '../schemas/explore';
import { tmdbMovie } from '../schemas/tmdb';
import { PARADISE_PICTURE_MOVIES } from './data/paradise-picture.movies';

export const seedExploreParadisePicture = async (db: DbClient) => {
  console.log('Seeding "Paradise Picture" explore map...');

  await db
    .insert(explore)
    .values({ name: 'Paradise Picture', slug: 'paradise-picture' })
    .onConflictDoNothing({ target: explore.slug });

  const [exploreRow] = await db
    .select({ id: explore.id })
    .from(explore)
    .where(eq(explore.slug, 'paradise-picture'));

  if (!exploreRow) {
    throw new Error('Failed to create or find the "Paradise Picture" explore map');
  }

  const existingMovies = await db
    .select({ id: tmdbMovie.id })
    .from(tmdbMovie)
    .where(
      inArray(
        tmdbMovie.id,
        PARADISE_PICTURE_MOVIES.map((movie) => movie.movieId),
      ),
    );
  const existingMovieIds = new Set(existingMovies.map((movie) => movie.id));

  const itemsToSeed = PARADISE_PICTURE_MOVIES.filter((movie) =>
    existingMovieIds.has(movie.movieId),
  );
  const skippedCount = PARADISE_PICTURE_MOVIES.length - itemsToSeed.length;
  if (skippedCount > 0) {
    console.warn(`Skipped ${skippedCount} movie(s) not found in tmdb.movie`);
  }

  if (itemsToSeed.length > 0) {
    await db
      .insert(exploreItem)
      .values(
        itemsToSeed.map((movie) => ({
          exploreId: exploreRow.id,
          type: 'movie' as const,
          movieId: movie.movieId,
          location: sql`ST_SetSRID(ST_MakePoint(${movie.lng}, ${movie.lat}), 4326)`,
        })),
      )
      .onConflictDoNothing({ target: [exploreItem.exploreId, exploreItem.movieId] });
  }

  console.log(`"Paradise Picture" explore map seeded successfully (${itemsToSeed.length} items).`);
};
