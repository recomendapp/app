import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { logMovie, reviewMovie } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { ReviewMovieDto, ReviewMovieInputDto } from './dto/reviews-movie.dto';
import DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class MoviesReviewService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async upsert({
    user,
    movieId,
    dto,
  }: {
    user: User,
    movieId: number,
    dto: ReviewMovieInputDto,
  }): Promise<ReviewMovieDto> {
    const logEntry = await this.db.query.logMovie.findFirst({
      where: and(
        eq(logMovie.userId, user.id),
        eq(logMovie.movieId, movieId),
      ),
      columns: {
        id: true,
        rating: true,
      },
    });

    if (!logEntry) {
      throw new NotFoundException('Log entry not found');
    }

    if (logEntry.rating === null) {
      throw new BadRequestException('Rating is required');
    }

    const sanitizedBody = DOMPurify.sanitize(dto.body);
    const wrappedHtml = `<html>${sanitizedBody}</html>`;

    const [upsertedReview] = await this.db.insert(reviewMovie)
      .values({
        id: logEntry.id,
        title: dto.title ?? null,
        body: wrappedHtml,
        isSpoiler: dto.isSpoiler,
      })
      .onConflictDoUpdate({
        target: reviewMovie.id,
        set: {
          title: dto.title ?? null,
          body: wrappedHtml,
          isSpoiler: dto.isSpoiler,
        },
      })
      .returning();

    return upsertedReview;
  }

  async delete({
    user,
    movieId,
  }: {
    user: User,
    movieId: number,
  }): Promise<ReviewMovieDto> {
    const logEntry = await this.db.query.logMovie.findFirst({
      where: and(
        eq(logMovie.userId, user.id),
        eq(logMovie.movieId, movieId),
      ),
      columns: {
        id: true,
      },
    });

    if (!logEntry) {
      throw new NotFoundException('Log entry not found');
    }

    const [deletedReview] = await this.db.delete(reviewMovie)
      .where(eq(reviewMovie.id, logEntry.id))
      .returning();

    if (!deletedReview) {
      throw new NotFoundException('Review not found');
    }

    return deletedReview;
  }
}
