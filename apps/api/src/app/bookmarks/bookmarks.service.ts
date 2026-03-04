import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { User } from '../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { BookmarkDto, BookmarkInputDto } from './dto/bookmarks.dto';
import { bookmark } from '@libs/db/schemas';
import { BookmarkTarget } from './bookmarks.type';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class BookmarksService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getWhereConditions(userId: string, target: BookmarkTarget) {
    const conditions = [eq(bookmark.userId, userId)];

    if (target.id) {
      conditions.push(eq(bookmark.id, target.id));
    } else if (target.movieId) {
      conditions.push(eq(bookmark.movieId, target.movieId));
      conditions.push(eq(bookmark.type, 'movie'));
    } else if (target.tvSeriesId) {
      conditions.push(eq(bookmark.tvSeriesId, target.tvSeriesId));
      conditions.push(eq(bookmark.type, 'tv_series'));
    }

    return and(...conditions);
  }

  async get({
    user,
    ...target
  }: {
    user: User;
  } & BookmarkTarget): Promise<BookmarkDto | null> {
    const bookmarkEntry = await this.db.query.bookmark.findFirst({
      where: this.getWhereConditions(user.id, target),
    })
    if (!bookmarkEntry) return null;
    return plainToInstance(BookmarkDto, {
      id: bookmarkEntry.id,
      userId: bookmarkEntry.userId,
      type: bookmarkEntry.type,
      mediaId: bookmarkEntry.movieId ?? bookmarkEntry.tvSeriesId ?? 0,
      status: bookmarkEntry.status,
      comment: bookmarkEntry.comment,
      createdAt: bookmarkEntry.createdAt,
      updatedAt: bookmarkEntry.updatedAt,
    });
  }

  async set({
    user,
    dto,
    id,
    movieId,
    tvSeriesId,
  }: {
    user: User;
    dto: BookmarkInputDto;
  } & BookmarkTarget): Promise<BookmarkDto> {
    let result: typeof bookmark.$inferSelect;

    if (id) {
      const [updated] = await this.db
        .update(bookmark)
        .set({ comment: dto.comment })
        .where(and(eq(bookmark.id, id), eq(bookmark.userId, user.id)))
        .returning();

      if (!updated) throw new NotFoundException('Bookmark not found for update');

      result = updated;
    } else {
      const type = movieId ? 'movie' : 'tv_series';
      const targetCols = movieId ? [bookmark.userId, bookmark.movieId] : [bookmark.userId, bookmark.tvSeriesId];
      
      const targetWhereSql = movieId
        ? sql`${bookmark.status} = 'active'::bookmark_status AND ${bookmark.type} = 'movie'::bookmark_type`
        : sql`${bookmark.status} = 'active'::bookmark_status AND ${bookmark.type} = 'tv_series'::bookmark_type`;

      const [upserted] = await this.db
        .insert(bookmark)
        .values({
          userId: user.id,
          type: type,
          movieId: movieId || null,
          tvSeriesId: tvSeriesId || null,
          status: 'active',
          comment: dto.comment,
        })
        .onConflictDoUpdate({
          target: targetCols,
          targetWhere: targetWhereSql,
          set: {
            comment: dto.comment !== undefined ? dto.comment : sql`${bookmark.comment}`,
          },
        })
        .returning();

      result = upserted;
    }

    return plainToInstance(BookmarkDto, {
      id: result.id,
      userId: result.userId,
      type: result.type,
      mediaId: result.movieId ?? result.tvSeriesId ?? 0,
      status: result.status,
      comment: result.comment,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }

  async delete({
    user,
    ...target
  }: {
    user: User;
  } & BookmarkTarget): Promise<BookmarkDto> {
    return await this.db.transaction(async (tx) => {
      const [deletedBookmark] = await tx
        .delete(bookmark)
        .where(this.getWhereConditions(user.id, target))
        .returning();

      if (!deletedBookmark) {
        throw new NotFoundException('Bookmark entry not found');
      }

      return plainToInstance(BookmarkDto, {
        id: deletedBookmark.id,
        userId: deletedBookmark.userId,
        type: deletedBookmark.type,
        mediaId: deletedBookmark.movieId ?? deletedBookmark.tvSeriesId ?? 0,
        status: deletedBookmark.status,
        comment: deletedBookmark.comment,
        createdAt: deletedBookmark.createdAt,
        updatedAt: deletedBookmark.updatedAt,
      });
    });
  }
}
