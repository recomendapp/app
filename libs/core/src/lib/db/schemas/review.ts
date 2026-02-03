import {
  bigint,
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { relations, sql } from 'drizzle-orm';
import { logMovie, logTvSeries } from './log';

/* ---------------------------------- MOVIE --------------------------------- */
export const reviewMovie = pgTable(
  'review_movie',
  {
	id: bigint({ mode: 'number' })
		.primaryKey()
		.references(() => logMovie.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.$onUpdate(() => sql`now()`)
		.notNull(),
	title: text(),
	body: text().notNull(),
	// States
	isSpoiler: boolean('is_spoiler').default(false).notNull(),
	// Counts
	likesCount: bigint('likes_count', { mode: 'number' })
		.default(0)
		.notNull(),
	viewsCount: bigint('views_count', { mode: 'number' })
		.default(0)
		.notNull(),
	commentsCount: bigint('comments_count', { mode: 'number' })
		.default(0)
		.notNull(),
  },
  (table) => [
	index('idx_review_movie_created_at').on(table.createdAt),
	index('idx_review_movie_likes_count').on(table.likesCount),
	index('idx_review_movie_views_count').on(table.viewsCount),
	index('idx_review_movie_comments_count').on(table.commentsCount),
	check(
		'check_review_movie_title',
		sql`(title IS NULL) OR ((length(title) >= 1) AND (length(title) <= 100))`,
	),
	check(
		'check_review_movie_body_html_wrapper',
		sql`body ~ '^<html>.*</html>$'::text`,
	),
	
  ],
);
export const reviewMovieRelations = relations(reviewMovie, ({ one }) => ({
	log: one(logMovie, {
		fields: [reviewMovie.id],
		references: [logMovie.id],
	}),
}));

export const reviewMovieLike = pgTable(
	'review_movie_like',
	{
		reviewId: bigint({ mode: 'number' })
			.notNull()
			.references(() => reviewMovie.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		},
	(table) => [
		primaryKey({ columns: [table.reviewId, table.userId] }),
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
/* -------------------------------- TV SERIES ------------------------------- */
export const reviewTvSeries = pgTable(
  'review_tv_series',
  {
	id: bigint({ mode: 'number' })
		.primaryKey()
		.references(() => logTvSeries.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.$onUpdate(() => sql`now()`)
		.notNull(),
	title: text(),
	body: text().notNull(),
	// States
	isSpoiler: boolean('is_spoiler').default(false).notNull(),
	// Counts
	likesCount: bigint('likes_count', { mode: 'number' })
		.default(0)
		.notNull(),
	viewsCount: bigint('views_count', { mode: 'number' })
		.default(0)
		.notNull(),
	commentsCount: bigint('comments_count', { mode: 'number' })
		.default(0)
		.notNull(),
  },
  (table) => [
	index('idx_review_tv_series_created_at').on(table.createdAt),
	index('idx_review_tv_series_likes_count').on(table.likesCount),
	index('idx_review_tv_series_views_count').on(table.viewsCount),
	index('idx_review_tv_series_comments_count').on(table.commentsCount),
	check(
		'check_review_tv_series_title',
		sql`(title IS NULL) OR ((length(title) >= 1) AND (length(title) <= 100))`,
	),
	check(
		'check_review_tv_series_body_html_wrapper',
		sql`body ~ '^<html>.*</html>$'::text`,
	),	
  ],
);
export const reviewTvSeriesRelations = relations(reviewTvSeries, ({ one }) => ({
	log: one(logTvSeries, {
		fields: [reviewTvSeries.id],
		references: [logTvSeries.id],
	}),
}));

export const reviewTvSeriesLike = pgTable(
	'review_tv_series_like',
	{
		reviewId: bigint({ mode: 'number' })
			.notNull()
			.references(() => reviewTvSeries.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		},
	(table) => [
		primaryKey({ columns: [table.reviewId, table.userId] }),
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