import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MovieDto } from './dto/movies.dto';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { tmdbMovieCredit, tmdbMovieRole, tmdbMovieView, tmdbPersonView, user } from '@libs/db/schemas';
import { and, asc, eq, sql } from 'drizzle-orm';
import { User } from '../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { MovieCastingDto } from './dto/movie-credits.dto';

@Injectable()
export class MoviesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    movieId,
    currentUser,
    locale,
  }: {
    movieId: number;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<MovieDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );
      if (currentUser) {
        await tx.execute(
          sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`
        );
      }

      const [movie] = await tx
        .select()
        .from(tmdbMovieView)
        .where(eq(tmdbMovieView.id, movieId))
        .limit(1);

      if (!movie) {
        throw new NotFoundException(`Movie with id ${movieId} not found`);
      }

      return movie;
    });
  }

  async getCasting({
    movieId,
    locale,
  }: {
    movieId: number;
    locale: SupportedLocale;
  }): Promise<MovieCastingDto[]> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT set_config('app.current_language', ${locale}, true)`
      );

      const aggregatedCastingSq = tx
        .select({
          movieId: tmdbMovieCredit.movieId,
          personId: tmdbMovieCredit.personId,
          order: sql<number>`MIN(${tmdbMovieRole.order})`.as('min_order'),
          roles: sql<Pick<typeof tmdbMovieRole.$inferSelect, 'character' | 'order'>[]>`
            jsonb_agg(
              jsonb_build_object(
                'character', ${tmdbMovieRole.character},
                'order', ${tmdbMovieRole.order}
              ) ORDER BY ${tmdbMovieRole.order} ASC
            )
          `.as('roles_agg'),
        })
        .from(tmdbMovieCredit)
        .leftJoin(tmdbMovieRole, eq(tmdbMovieRole.creditId, tmdbMovieCredit.id))
        .where(
          and(
            eq(tmdbMovieCredit.movieId, movieId),
            eq(tmdbMovieCredit.job, 'Actor')
          )
        )
        .groupBy(tmdbMovieCredit.movieId, tmdbMovieCredit.personId)
        .as('aggregated_casting');

      const castingData = await tx
        .select({
          movieId: aggregatedCastingSq.movieId,
          personId: aggregatedCastingSq.personId,
          order: aggregatedCastingSq.order,
          roles: aggregatedCastingSq.roles,
          person: {
            id: tmdbPersonView.id,
            name: tmdbPersonView.name,
            profilePath: tmdbPersonView.profilePath,
            slug: tmdbPersonView.slug,
            url: tmdbPersonView.url,
          },
        })
        .from(aggregatedCastingSq)
        .innerJoin(tmdbPersonView, eq(tmdbPersonView.id, aggregatedCastingSq.personId))
        .orderBy(asc(aggregatedCastingSq.order));
      
      return castingData;
    });
  }
}
