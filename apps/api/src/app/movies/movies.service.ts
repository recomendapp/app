import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MovieDto } from './dto/movies.dto';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { tmdbMovieView } from '@libs/db/schemas';
import { eq, sql } from 'drizzle-orm';
import { User } from '../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';

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
}
