import { bigint, check, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations, sql } from "drizzle-orm";
import { tmdbMovie, tmdbTvSeries } from "./tmdb";

export const playlistVisibilityEnum = pgEnum('playlist_visibility_enum', ['public', 'private', 'followers']);

// Playlist
export const playlist = pgTable(
	'playlist',
	{
		id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text().notNull(),
		description: text(),
		poster: text('poster'),
		// States
		visibility: playlistVisibilityEnum('visibility').default('public').notNull(),
		// Counts
		itemsCount: bigint('items_count', { mode: 'number' })
			.default(0)
			.notNull(),
		savedCount: bigint('saved_count', { mode: 'number' })
			.default(0)
			.notNull(),
		likesCount: bigint('likes_count', { mode: 'number' })
			.default(0)
			.notNull(),
	},
	(table) => [
		index('idx_playlist_created_at').on(table.createdAt),
		index('idx_playlist_visibility').on(table.visibility),
		index('idx_playlist_items_count').on(table.itemsCount),
		index('idx_playlist_likes_count').on(table.likesCount),
		index('idx_playlist_saved_count').on(table.savedCount),
		index('idx_playlist_user_id').on(table.userId),
		check(
			'check_playlist_description_check',
			sql`((description IS NULL) OR ((length(description) >= 1) AND (length(description) <= 300))) AND ((description IS NULL) OR (description !~ '.*\n\s*\n.*'::text)) AND ((description IS NULL) OR (TRIM(BOTH FROM description) <> ''::text))`,
		),
		check('check_playlist_items_count_check', sql`items_count >= 0`),
		check('check_playlist_likes_count_check', sql`likes_count >= 0`),
		check('check_playlist_saved_count_check', sql`saved_count >= 0`),
		check(
			'playlists_title_check',
			sql`(length(title) >= 1) AND (length(title) <= 100)`,
		),
	]
);
export const playlistRelations = relations(playlist, ({ one }) => ({
	user: one(user, {
		fields: [playlist.userId],
		references: [user.id],
	}),
}));

// Item
export const playlistItemTypeEnum = pgEnum('playlist_item_type_enum', ['movie', 'tv_series']);
export const playlistItem = pgTable(
  'playlist_item',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
	playlistId: bigint('playlist_id', { mode: 'number' })
		.notNull()
		.references(() => playlist.id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
	comment: text(),
	rank: integer().notNull(),
	// Type & References
	type: playlistItemTypeEnum('type').notNull(),
	movieId: bigint('movie_id', { mode: 'number' })
			.references(() => tmdbMovie.id, { onDelete: 'cascade' }),
	tvSeriesId: bigint('tv_series_id', { mode: 'number' })
			.references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
	},
  (table) => [
	index('idx_playlist_item_playlist_id').on(table.playlistId),
    index('idx_playlist_item_user_id').on(table.userId),
    index('idx_playlist_item_rank').on(table.rank),
	check('check_playlist_item_comment', sql`length(comment) <= 180`),
    check('check_playlist_item_rank', sql`rank >= 1`),
	check(
	  'check_playlist_item_type_references',
	  sql`(
		(type = 'movie'::playlist_item_type_enum AND movie_id IS NOT NULL AND tv_series_id IS NULL)
		OR
		(type = 'tv_series'::playlist_item_type_enum AND tv_series_id IS NOT NULL AND movie_id IS NULL)
	  )`,
	),
  ],
);
export const playlistItemRelations = relations(playlistItem, ({ one }) => ({
	playlist: one(playlist, {
		fields: [playlistItem.playlistId],
		references: [playlist.id],
	}),
	user: one(user, {
		fields: [playlistItem.userId],
		references: [user.id],
	}),
	movie: one(tmdbMovie, {
		fields: [playlistItem.movieId],
		references: [tmdbMovie.id],
	}),
	tvSeries: one(tmdbTvSeries, {
		fields: [playlistItem.tvSeriesId],
		references: [tmdbTvSeries.id],
	}),
}));

// Member
export const playlistMemberRoleEnum = pgEnum('playlist_member_role_enum', ['viewer', 'editor']);
export const playlistMember = pgTable(
  'playlist_member',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
	playlistId: bigint('playlist_id', { mode: 'number' })
		.notNull()
		.references(() => playlist.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    role: playlistMemberRoleEnum('role').default('viewer').notNull(),
  },
  (table) => [
    index('playlist_member_playlist_id').on(table.playlistId),
    index('playlist_member_user_id').on(table.userId),
	unique('unique_playlist_member_playlist_user').on(table.playlistId, table.userId),
  ],
);
export const playlistMemberRelations = relations(playlistMember, ({ one }) => ({
	user: one(user, {
		fields: [playlistMember.userId],
		references: [user.id],
	}),
	playlist: one(playlist, {
		fields: [playlistMember.playlistId],
		references: [playlist.id],
	}),
}));

// Like
export const playlistLike = pgTable(
  'playlist_like',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    playlistId: bigint('playlist_id', { mode: 'number' })
		.notNull()
		.references(() => playlist.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_playlist_like_playlist_id').on(table.playlistId),
    index('idx_playlist_like_user_id').on(table.userId),
	unique('unique_playlist_like_playlist_user').on(table.playlistId, table.userId),
  ],
);

// Saved
export const playlistSaved = pgTable(
  'playlist_saved',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    playlistId: bigint('playlist_id', { mode: 'number' })
		.notNull()
		.references(() => playlist.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_playlist_saved_playlist_id').on(table.playlistId),
    index('idx_playlist_saved_user_id').on(table.userId),
	unique('unique_playlist_saved_playlist_user').on(table.playlistId, table.userId),
  ],
);