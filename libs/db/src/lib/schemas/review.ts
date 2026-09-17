import {
  AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { relations, sql } from 'drizzle-orm';
import { logMovie, logTvSeries } from './log';
import { REVIEW_COMMENT_RULES, REVIEW_RULES } from '@libs/rules';

/* ---------------------------------- MOVIE --------------------------------- */
export const reviewMovie = pgTable(
  'review_movie',
  {
    id: bigint({ mode: 'number' })
      .primaryKey()
      .references(() => logMovie.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    title: text(),
    body: text().notNull(),
    // States
    isSpoiler: boolean('is_spoiler').default(false).notNull(),
    // Counts
    likesCount: bigint('likes_count', { mode: 'number' }).default(0).notNull(),
    viewsCount: bigint('views_count', { mode: 'number' }).default(0).notNull(),
    commentsCount: bigint('comments_count', { mode: 'number' }).default(0).notNull(),
  },
  (table) => [
    index('idx_review_movie_created_at').on(table.createdAt),
    index('idx_review_movie_likes_count').on(table.likesCount),
    index('idx_review_movie_views_count').on(table.viewsCount),
    index('idx_review_movie_comments_count').on(table.commentsCount),
    check(
      'check_review_movie_title',
      sql`(title IS NULL) OR ((length(title) >= ${sql.raw(String(REVIEW_RULES.TITLE.MIN))}) AND (length(title) <= ${sql.raw(String(REVIEW_RULES.TITLE.MAX))}))`,
    ),
    check(
      'check_review_movie_body',
      sql`(length(body) >= ${sql.raw(String(REVIEW_RULES.BODY.MIN))}) AND (length(body) <= ${sql.raw(String(REVIEW_RULES.BODY.MAX))})`,
    ),
  ],
);
export const reviewMovieRelations = relations(reviewMovie, ({ one, many }) => ({
  log: one(logMovie, {
    fields: [reviewMovie.id],
    references: [logMovie.id],
  }),
  comments: many(reviewMovieComment),
}));

export const reviewMovieLike = pgTable(
  'review_movie_like',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    reviewId: bigint('review_id', { mode: 'number' })
      .notNull()
      .references(() => reviewMovie.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('unique_review_movie_like').on(table.reviewId, table.userId),
    index('idx_review_movie_like_user_id').on(table.userId),
  ],
);
export const reviewMovieLikeRelations = relations(reviewMovieLike, ({ one }) => ({
  review: one(reviewMovie, {
    fields: [reviewMovieLike.reviewId],
    references: [reviewMovie.id],
  }),
  user: one(user, {
    fields: [reviewMovieLike.userId],
    references: [user.id],
  }),
}));

export const reviewMovieComment = pgTable(
  'review_movie_comment',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    reviewId: bigint('review_id', { mode: 'number' })
      .notNull()
      .references(() => reviewMovie.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: bigint('parent_id', { mode: 'number' }).references(
      (): AnyPgColumn => reviewMovieComment.id,
      { onDelete: 'cascade' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    body: text().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    // Counts
    likesCount: bigint('likes_count', { mode: 'number' }).default(0).notNull(),
    repliesCount: bigint('replies_count', { mode: 'number' }).default(0).notNull(),
  },
  (table) => [
    index('idx_review_movie_comment_review_id').on(table.reviewId),
    index('idx_review_movie_comment_parent_id').on(table.parentId),
    index('idx_review_movie_comment_user_id').on(table.userId),
    index('idx_review_movie_comment_created_at').on(table.createdAt),
    index('idx_review_movie_comment_likes_count').on(table.likesCount),
    check(
      'check_review_movie_comment_body',
      sql`(length(body) >= ${sql.raw(String(REVIEW_COMMENT_RULES.BODY.MIN))}) AND (length(body) <= ${sql.raw(String(REVIEW_COMMENT_RULES.BODY.MAX))})`,
    ),
  ],
);
export const reviewMovieCommentRelations = relations(reviewMovieComment, ({ one, many }) => ({
  review: one(reviewMovie, {
    fields: [reviewMovieComment.reviewId],
    references: [reviewMovie.id],
  }),
  user: one(user, {
    fields: [reviewMovieComment.userId],
    references: [user.id],
  }),
  parent: one(reviewMovieComment, {
    fields: [reviewMovieComment.parentId],
    references: [reviewMovieComment.id],
    relationName: 'review_movie_comment_replies',
  }),
  replies: many(reviewMovieComment, {
    relationName: 'review_movie_comment_replies',
  }),
  likes: many(reviewMovieCommentLike),
}));

export const reviewMovieCommentLike = pgTable(
  'review_movie_comment_like',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    commentId: bigint('comment_id', { mode: 'number' })
      .notNull()
      .references(() => reviewMovieComment.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('unique_review_movie_comment_like').on(table.commentId, table.userId),
    index('idx_review_movie_comment_like_user_id').on(table.userId),
  ],
);
export const reviewMovieCommentLikeRelations = relations(reviewMovieCommentLike, ({ one }) => ({
  comment: one(reviewMovieComment, {
    fields: [reviewMovieCommentLike.commentId],
    references: [reviewMovieComment.id],
  }),
  user: one(user, {
    fields: [reviewMovieCommentLike.userId],
    references: [user.id],
  }),
}));
/* -------------------------------- TV SERIES ------------------------------- */
export const reviewTvSeries = pgTable(
  'review_tv_series',
  {
    id: bigint({ mode: 'number' })
      .primaryKey()
      .references(() => logTvSeries.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    title: text(),
    body: text().notNull(),
    // States
    isSpoiler: boolean('is_spoiler').default(false).notNull(),
    // Counts
    likesCount: bigint('likes_count', { mode: 'number' }).default(0).notNull(),
    viewsCount: bigint('views_count', { mode: 'number' }).default(0).notNull(),
    commentsCount: bigint('comments_count', { mode: 'number' }).default(0).notNull(),
  },
  (table) => [
    index('idx_review_tv_series_created_at').on(table.createdAt),
    index('idx_review_tv_series_likes_count').on(table.likesCount),
    index('idx_review_tv_series_views_count').on(table.viewsCount),
    index('idx_review_tv_series_comments_count').on(table.commentsCount),
    check(
      'check_review_tv_series_title',
      sql`(title IS NULL) OR ((length(title) >= ${sql.raw(String(REVIEW_RULES.TITLE.MIN))}) AND (length(title) <= ${sql.raw(String(REVIEW_RULES.TITLE.MAX))}))`,
    ),
    check(
      'check_review_tv_series_body',
      sql`(length(body) >= ${sql.raw(String(REVIEW_RULES.BODY.MIN))}) AND (length(body) <= ${sql.raw(String(REVIEW_RULES.BODY.MAX))})`,
    ),
  ],
);
export const reviewTvSeriesRelations = relations(reviewTvSeries, ({ one, many }) => ({
  log: one(logTvSeries, {
    fields: [reviewTvSeries.id],
    references: [logTvSeries.id],
  }),
  comments: many(reviewTvSeriesComment),
}));

export const reviewTvSeriesLike = pgTable(
  'review_tv_series_like',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    reviewId: bigint('review_id', { mode: 'number' })
      .notNull()
      .references(() => reviewTvSeries.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('unique_review_tv_series_like').on(table.reviewId, table.userId),
    index('idx_review_tv_series_like_user_id').on(table.userId),
  ],
);
export const reviewTvSeriesLikeRelations = relations(reviewTvSeriesLike, ({ one }) => ({
  review: one(reviewTvSeries, {
    fields: [reviewTvSeriesLike.reviewId],
    references: [reviewTvSeries.id],
  }),
  user: one(user, {
    fields: [reviewTvSeriesLike.userId],
    references: [user.id],
  }),
}));

export const reviewTvSeriesComment = pgTable(
  'review_tv_series_comment',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    reviewId: bigint('review_id', { mode: 'number' })
      .notNull()
      .references(() => reviewTvSeries.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: bigint('parent_id', { mode: 'number' }).references(
      (): AnyPgColumn => reviewTvSeriesComment.id,
      { onDelete: 'cascade' },
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    body: text().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    // Counts
    likesCount: bigint('likes_count', { mode: 'number' }).default(0).notNull(),
    repliesCount: bigint('replies_count', { mode: 'number' }).default(0).notNull(),
  },
  (table) => [
    index('idx_review_tv_series_comment_review_id').on(table.reviewId),
    index('idx_review_tv_series_comment_parent_id').on(table.parentId),
    index('idx_review_tv_series_comment_user_id').on(table.userId),
    index('idx_review_tv_series_comment_created_at').on(table.createdAt),
    index('idx_review_tv_series_comment_likes_count').on(table.likesCount),
    check(
      'check_review_tv_series_comment_body',
      sql`(length(body) >= ${sql.raw(String(REVIEW_COMMENT_RULES.BODY.MIN))}) AND (length(body) <= ${sql.raw(String(REVIEW_COMMENT_RULES.BODY.MAX))})`,
    ),
  ],
);
export const reviewTvSeriesCommentRelations = relations(reviewTvSeriesComment, ({ one, many }) => ({
  review: one(reviewTvSeries, {
    fields: [reviewTvSeriesComment.reviewId],
    references: [reviewTvSeries.id],
  }),
  user: one(user, {
    fields: [reviewTvSeriesComment.userId],
    references: [user.id],
  }),
  parent: one(reviewTvSeriesComment, {
    fields: [reviewTvSeriesComment.parentId],
    references: [reviewTvSeriesComment.id],
    relationName: 'review_tv_series_comment_replies',
  }),
  replies: many(reviewTvSeriesComment, {
    relationName: 'review_tv_series_comment_replies',
  }),
  likes: many(reviewTvSeriesCommentLike),
}));

export const reviewTvSeriesCommentLike = pgTable(
  'review_tv_series_comment_like',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    commentId: bigint('comment_id', { mode: 'number' })
      .notNull()
      .references(() => reviewTvSeriesComment.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('unique_review_tv_series_comment_like').on(table.commentId, table.userId),
    index('idx_review_tv_series_comment_like_user_id').on(table.userId),
  ],
);
export const reviewTvSeriesCommentLikeRelations = relations(
  reviewTvSeriesCommentLike,
  ({ one }) => ({
    comment: one(reviewTvSeriesComment, {
      fields: [reviewTvSeriesCommentLike.commentId],
      references: [reviewTvSeriesComment.id],
    }),
    user: one(user, {
      fields: [reviewTvSeriesCommentLike.userId],
      references: [user.id],
    }),
  }),
);
