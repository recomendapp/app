import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { BookmarkDto, BookmarkRequestDto } from '../../bookmark/dto/bookmark.dto';
import { bookmark } from '@libs/db/schemas';

@Injectable()
export class MoviesBookmarkService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({
    user,
    movieId,
  }: {
    user: User;
    movieId: number;
  }): Promise<BookmarkDto | null> {
    const bookmarkEntry = await this.db.query.bookmark.findFirst({
      where: and(
        eq(bookmark.userId, user.id),
        eq(bookmark.movieId, movieId),
        eq(bookmark.type, 'movie'),
      ),
    })
    if (!bookmarkEntry) return null;
    return new BookmarkDto({
      id: bookmarkEntry.id,
      userId: bookmarkEntry.userId,
      type: bookmarkEntry.type,
      mediaId: bookmarkEntry.movieId,
      status: bookmarkEntry.status,
      comment: bookmarkEntry.comment,
      createdAt: bookmarkEntry.createdAt,
      updatedAt: bookmarkEntry.updatedAt,
    });
  }

  async set({
    user,
    movieId,
    dto,
  }: {
    user: User;
    movieId: number;
    dto: BookmarkRequestDto;
  }): Promise<BookmarkDto> {
    const [result] = await this.db
      .insert(bookmark)
      .values({
        userId: user.id,
        type: 'movie',
        movieId: movieId,
        status: 'active',
        comment: dto.comment,
      })
      .onConflictDoUpdate({
        target: [bookmark.userId, bookmark.movieId],
        targetWhere: sql`${bookmark.status} = 'active'::bookmark_status AND ${bookmark.type} = 'movie'::bookmark_type`,
        set: {
          comment: dto.comment !== undefined ? dto.comment : sql`${bookmark.comment}`,
        },
      })
      .returning();

    return new BookmarkDto({
      id: result.id,
      userId: result.userId,
      type: result.type,
      mediaId: result.movieId,
      status: result.status,
      comment: result.comment,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }

  async delete({
    user,
    movieId,
  }: {
    user: User;
    movieId: number;
  }): Promise<BookmarkDto> {
    return await this.db.transaction(async (tx) => {
      const bookmarkEntry = await tx.query.bookmark.findFirst({
        where: and(
          eq(bookmark.userId, user.id),
          eq(bookmark.movieId, movieId),
          eq(bookmark.type, 'movie'),
        ),
      });

      if (!bookmarkEntry) {
        throw new NotFoundException('Bookmark entry not found');
      }

      await tx.delete(bookmark).where(
        and(
          eq(bookmark.userId, user.id),
          eq(bookmark.movieId, movieId),
        )
      );

      return new BookmarkDto({
        id: bookmarkEntry.id,
        userId: bookmarkEntry.userId,
        type: bookmarkEntry.type,
        mediaId: bookmarkEntry.movieId,
        status: bookmarkEntry.status,
        comment: bookmarkEntry.comment,
        createdAt: bookmarkEntry.createdAt,
        updatedAt: bookmarkEntry.updatedAt,
      });
    });
  }
}
