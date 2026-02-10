import {
  pgTable,
  index,
  foreignKey,
  pgPolicy,
  bigint,
  timestamp,
  uuid,
  check,
  text,
  integer,
  date,
  jsonb,
  smallint,
  real,
  numeric,
  boolean,
  unique,
  uniqueIndex,
  pgView,
  pgMaterializedView,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const eventType = pgEnum('eventType', ['INSERT', 'DELETE', 'UPDATE']);
export const feedType = pgEnum('feed_type', [
  'activity_movie',
  'activity_tv_series',
  'review_movie_like',
  'review_tv_series_like',
  'playlist_like',
]);
export const languageApp = pgEnum('language_app', ['en-US', 'fr-FR']);
export const mediaType = pgEnum('media_type', [
  'movie',
  'tv_series',
  'person',
  'tv_season',
  'tv_episode',
]);
export const notificationType = pgEnum('notification_type', [
  'follower_created',
  'follower_accepted',
  'follower_request',
  'friend_created',
  'reco_sent',
  'reco_completed',
  'reco_sent_movie',
  'reco_sent_tv_series',
  'reco_completed_movie',
  'reco_completed_tv_series',
]);
export const notificationsDeviceType = pgEnum('notifications_device_type', [
  'web',
  'ios',
  'android',
  'windows',
  'macos',
]);
export const notificationsProvider = pgEnum('notifications_provider', [
  'fcm',
  'expo',
  'apns',
]);
export const playlistsType = pgEnum('playlists_type', ['movie', 'tv_series']);
export const pricingPlanInterval = pgEnum('pricing_plan_interval', [
  'day',
  'week',
  'month',
  'year',
]);
export const pricingType = pgEnum('pricing_type', ['one_time', 'recurring']);
export const recoStatus = pgEnum('reco_status', [
  'active',
  'completed',
  'deleted',
]);
export const subscriptionStatus = pgEnum('subscription_status', [
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
]);
export const syncLogsStatus = pgEnum('sync_logs_status', [
  'initialized',
  'fetching_data',
  'data_fetched',
  'syncing_to_db',
  'updating_popularity',
  'success',
  'failed',
]);
export const syncLogsType = pgEnum('sync_logs_type', [
  'tmdb_movie',
  'tmdb_person',
  'tmdb_collection',
  'tmdb_keyword',
  'tmdb_company',
  'tmdb_language',
  'tmdb_country',
  'tmdb_genre',
  'tmdb_network',
  'tmdb_tv_serie',
]);
export const userActivityType = pgEnum('user_activity_type', [
  'movie',
  'tv_series',
]);
export const userRecosType = pgEnum('user_recos_type', ['movie', 'tv_series']);
export const userReviewType = pgEnum('user_review_type', [
  'movie',
  'tv_series',
]);
export const userWatchlistType = pgEnum('user_watchlist_type', [
  'movie',
  'tv_series',
]);
export const watchlistStatus = pgEnum('watchlist_status', [
  'active',
  'completed',
]);


export const explore = pgTable(
  'explore',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).generatedByDefaultAsIdentity({
      name: 'explore_id_seq1',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    name: text().notNull(),
    slug: text().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    pgPolicy('Enable read access for all users', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
  ],
);

export const exploreItems = pgTable(
  'explore_items',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).generatedByDefaultAsIdentity({
      name: 'explore_items_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    exploreId: bigint('explore_id', { mode: 'number' }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    movieId: bigint('movie_id', { mode: 'number' }).notNull(),
    // TODO: failed to parse database type 'gis.geometry(Point,4326)'
    location: unknown('location').notNull(),
  },
  (table) => [
    index('idx_explore_items_explore_id').using(
      'btree',
      table.exploreId.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_explore_items_location').using(
      'gist',
      table.location.asc().nullsLast().op('gist_geometry_ops_2d'),
    ),
    index('idx_explore_items_movie_id').using(
      'btree',
      table.movieId.asc().nullsLast().op('int8_ops'),
    ),
    foreignKey({
      columns: [table.exploreId],
      foreignColumns: [explore.id],
      name: 'explore_items_explore_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.movieId],
      foreignColumns: [tmdbMovie.id],
      name: 'explore_items_movie_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Enable read access for all users', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
  ],
);

export const syncLogs = pgTable(
  'sync_logs',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).generatedByDefaultAsIdentity({
      name: 'sync_logs_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    }).defaultNow(),
    type: syncLogsType().notNull(),
    status: syncLogsStatus().default('initialized').notNull(),
    date: date().defaultNow().notNull(),
  },
  (table) => [
    index('idx_sync_logs_date').using(
      'btree',
      table.date.asc().nullsLast().op('date_ops'),
    ),
    index('idx_sync_logs_status').using(
      'btree',
      table.status.asc().nullsLast().op('enum_ops'),
    ),
    index('idx_sync_logs_type').using(
      'btree',
      table.type.asc().nullsLast().op('enum_ops'),
    ),
  ],
);

export const userBilling = pgTable(
  'user_billing',
  {
    userId: uuid('user_id').notNull(),
    billingAddress: jsonb('billing_address'),
    paymentMethod: jsonb('payment_method'),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'user_billing_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    pgPolicy('User can only see his own data', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
  ],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid().defaultRandom().notNull(),
    userId: uuid('user_id').notNull(),
    productId: text('product_id').notNull(),
    store: text().notNull(),
    status: text().notNull(),
    purchasedAt: timestamp('purchased_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    originalTransactionId: text('original_transaction_id').notNull(),
    transactionId: text('transaction_id'),
    environment: text().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_subscriptions_original_transaction_id').using(
      'btree',
      table.originalTransactionId.asc().nullsLast().op('text_ops'),
    ),
    index('subscriptions_product_id_idx').using(
      'btree',
      table.productId.asc().nullsLast().op('text_ops'),
    ),
    index('subscriptions_status_idx').using(
      'btree',
      table.status.asc().nullsLast().op('text_ops'),
    ),
    index('subscriptions_user_id_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'subscriptions_user_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('User can see his own sub', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
  ],
);

export const userDeletionRequests = pgTable(
  'user_deletion_requests',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).generatedByDefaultAsIdentity({
      name: 'user_deletion_requests_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    userId: uuid('user_id').notNull(),
    deleteAfter: timestamp('delete_after', {
      withTimezone: true,
      mode: 'string',
    })
      .default(sql`(now() + '30 days'::interval)`)
      .notNull(),
    requestedAt: timestamp('requested_at', {
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_user_deletion_requests_delete_after').using(
      'btree',
      table.deleteAfter.asc().nullsLast().op('timestamptz_ops'),
    ),
    index('idx_user_deletion_requests_user_id').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'user_deletion_requests_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    pgPolicy('User can select his own entry', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
    pgPolicy('User can insert his own entry', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('User can delete his own entry', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
  ],
);

export const mediaMovieStats = pgTable(
  'media_movie_stats',
  {
    voteAverage: numeric('vote_average', { precision: 10, scale: 1 }).default(
      'NULL',
    ),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    voteCount: bigint('vote_count', { mode: 'number' }).default(0).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    likesCount: bigint('likes_count', { mode: 'number' }).default(0).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    watchCount: bigint('watch_count', { mode: 'number' }).default(0).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    reviewCount: bigint('review_count', { mode: 'number' })
      .default(0)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    watchlistCount: bigint('watchlist_count', { mode: 'number' })
      .default(sql`'0'`)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    recosCount: bigint('recos_count', { mode: 'number' })
      .default(sql`'0'`)
      .notNull(),
    popularity: numeric({ precision: 10, scale: 2 }).generatedAlwaysAs(
      sql`((((((vote_count)::numeric * 0.3) + ((likes_count)::numeric * 0.25)) + ((watch_count)::numeric * 0.2)) + ((watchlist_count)::numeric * 0.15)) + ((recos_count)::numeric * 0.1))`,
    ),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).notNull(),
  },
  (table) => [
    index('idx_media_movie_stats_likes_count').using(
      'btree',
      table.likesCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_movie_stats_popularity').using(
      'btree',
      table.popularity.asc().nullsLast().op('numeric_ops'),
    ),
    index('idx_media_movie_stats_recos_count').using(
      'btree',
      table.recosCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_movie_stats_review_count').using(
      'btree',
      table.reviewCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_movie_stats_vote_count').using(
      'btree',
      table.voteCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_movie_stats_watch_count').using(
      'btree',
      table.watchCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_movie_stats_watchlist_count').using(
      'btree',
      table.watchlistCount.asc().nullsLast().op('int8_ops'),
    ),
    foreignKey({
      columns: [table.id],
      foreignColumns: [tmdbMovie.id],
      name: 'media_movie_stats_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Enable read access for all users', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
  ],
);

export const mediaTvSeriesStats = pgTable(
  'media_tv_series_stats',
  {
    voteAverage: numeric('vote_average', { precision: 10, scale: 1 }).default(
      'NULL',
    ),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    voteCount: bigint('vote_count', { mode: 'number' }).default(0).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    likesCount: bigint('likes_count', { mode: 'number' }).default(0).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    watchCount: bigint('watch_count', { mode: 'number' }).default(0).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    reviewCount: bigint('review_count', { mode: 'number' })
      .default(0)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    watchlistCount: bigint('watchlist_count', { mode: 'number' })
      .default(sql`'0'`)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    recosCount: bigint('recos_count', { mode: 'number' })
      .default(sql`'0'`)
      .notNull(),
    popularity: numeric({ precision: 10, scale: 2 }).generatedAlwaysAs(
      sql`((((((vote_count)::numeric * 0.3) + ((likes_count)::numeric * 0.25)) + ((watch_count)::numeric * 0.2)) + ((watchlist_count)::numeric * 0.15)) + ((recos_count)::numeric * 0.1))`,
    ),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).notNull(),
  },
  (table) => [
    index('idx_media_tv_series_stats_likes_count').using(
      'btree',
      table.likesCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_tv_series_stats_popularity').using(
      'btree',
      table.popularity.asc().nullsLast().op('numeric_ops'),
    ),
    index('idx_media_tv_series_stats_recos_count').using(
      'btree',
      table.recosCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_tv_series_stats_review_count').using(
      'btree',
      table.reviewCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_tv_series_stats_vote_count').using(
      'btree',
      table.voteCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_tv_series_stats_watch_count').using(
      'btree',
      table.watchCount.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_media_tv_series_stats_watchlist_count').using(
      'btree',
      table.watchlistCount.asc().nullsLast().op('int8_ops'),
    ),
    foreignKey({
      columns: [table.id],
      foreignColumns: [tmdbTvSeries.id],
      name: 'media_tv_series_stats_id_fkey',
    }).onDelete('cascade'),
    pgPolicy('Enable read access for all users', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
  ],
);

export const uiBackgrounds = pgTable(
  'ui_backgrounds',
  {
    id: uuid().defaultRandom().notNull(),
    url: text().notNull(),
    mediaType: mediaType('media_type').notNull(),
    mediaId: integer('media_id').notNull(),
  },
  (table) => [
    pgPolicy('Enable read access for all users', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
  ],
);



export const userPersonFollower = pgTable(
  'user_person_follower',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).generatedByDefaultAsIdentity({
      name: 'user_person_follower_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    personId: bigint('person_id', { mode: 'number' }).notNull(),
    userId: uuid('user_id').notNull(),
  },
  (table) => [
    index('idx_user_person_follower_created_at').using(
      'btree',
      table.createdAt.asc().nullsLast().op('timestamptz_ops'),
    ),
    index('idx_user_person_follower_person_id').using(
      'btree',
      table.personId.asc().nullsLast().op('int8_ops'),
    ),
    index('idx_user_person_follower_user_id').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.personId],
      foreignColumns: [tmdbPerson.id],
      name: 'user_person_follower_person_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'user_person_follower_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    pgPolicy('Users can delete their own followee', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
    pgPolicy('Users can insert their own followee', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('People can see if user is public or if you are friend with him', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
  ],
);

export const feed = pgTable(
  'feed',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).generatedByDefaultAsIdentity({
      name: 'feed_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id').notNull(),
    activityType: feedType('activity_type').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    activityId: bigint('activity_id', { mode: 'number' }).notNull(),
  },
  (table) => [
    uniqueIndex('idx_feed_activity_type_activity_id').using(
      'btree',
      table.activityType.asc().nullsLast().op('int8_ops'),
      table.activityId.asc().nullsLast().op('enum_ops'),
    ),
    index('idx_feed_user_id_created_at_desc').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
      table.createdAt.desc().nullsFirst().op('timestamptz_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'feed_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    pgPolicy('Enable select for users based on user_id', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
  ],
);

export const playlistsFeatured = pgTable(
  'playlists_featured',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).generatedByDefaultAsIdentity({
      name: 'playlists_featured_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [playlists.id],
      name: 'playlists_featured_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    pgPolicy('Enable read access for all users', {
      as: 'permissive',
      for: 'select',
      to: ['public'],
      using: sql`true`,
    }),
  ],
);



export const user = pgTable(
  'user',
  {
    id: uuid().primaryKey().notNull(),
    // TODO: failed to parse database type 'citext'
    username: unknown('username').notNull(),
    usernameUpdatedAt: timestamp('username_updated_at', {
      withTimezone: true,
      mode: 'string',
    }),
    fullName: text('full_name').notNull(),
    bio: text(),
    avatarUrl: text('avatar_url'),
    website: text(),
    favoriteColor: text('favorite_color').default('#03befc'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    followersCount: bigint('followers_count', { mode: 'number' })
      .default(sql`'0'`)
      .notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    followingCount: bigint('following_count', { mode: 'number' })
      .default(sql`'0'`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    backgroundUrl: text('background_url'),
    premium: boolean().default(false).notNull(),
    language: text().default('fr-FR').notNull(),
    private: boolean().default(false).notNull(),
  },
  (table) => [
    index('idx_user_created_at').using(
      'btree',
      table.createdAt.asc().nullsLast().op('timestamptz_ops'),
    ),
    index('idx_user_private').using(
      'btree',
      table.private.asc().nullsLast().op('bool_ops'),
    ),
    index('idx_user_username').using(
      'btree',
      table.username.asc().nullsLast().op('citext_ops'),
    ),
    index('idx_user_username_trgm').using(
      'gin',
      table.username.asc().nullsLast().op('gin_trgm_ops'),
    ),
    foreignKey({
      columns: [table.id],
      foreignColumns: [users.id],
      name: 'user_id_fkey',
    }),
    foreignKey({
      columns: [table.language],
      foreignColumns: [supportedLanguages.language],
      name: 'user_language_fkey',
    }),
    unique('profiles_username_key').on(table.username),
    pgPolicy('Users can insert their own profile.', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
      withCheck: sql`(( SELECT auth.uid() AS uid) = id)`,
    }),
    pgPolicy('User are viewable by everyone.', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
    }),
    pgPolicy('Enable update for users based on id', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
    check(
      'check_username_regex',
      sql`username ~* '^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{2,14}$'::text`,
    ),
    check(
      'user_bio_check',
      sql`bio ~* '^(?!\s+$)(?!.*\n\s*\n)[\s\S]{1,150}$'::text`,
    ),
    check('user_followers_count_check', sql`followers_count >= 0`),
    check('user_following_count_check', sql`following_count >= 0`),
    check(
      'user_full_name_check',
      sql`(char_length(full_name) >= 1) AND (char_length(full_name) <= 30)`,
    ),
    check(
      'username_length',
      sql`(char_length((username)::text) >= 3) AND (char_length((username)::text) <= 15)`,
    ),
  ],
);

export const userNotificationTokens = pgTable(
  'user_notification_tokens',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).generatedByDefaultAsIdentity({
      name: 'user_notification_tokens_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
    userId: uuid('user_id').notNull(),
    token: text().notNull(),
    provider: notificationsProvider().notNull(),
    deviceType: notificationsDeviceType('device_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_user_notification_tokens_device_type').using(
      'btree',
      table.deviceType.asc().nullsLast().op('enum_ops'),
    ),
    index('idx_user_notification_tokens_provider').using(
      'btree',
      table.provider.asc().nullsLast().op('enum_ops'),
    ),
    index('idx_user_notification_tokens_token').using(
      'btree',
      table.token.asc().nullsLast().op('text_ops'),
    ),
    index('idx_user_notification_tokens_updated_at').using(
      'btree',
      table.updatedAt.asc().nullsLast().op('timestamptz_ops'),
    ),
    index('idx_user_notification_tokens_user_id').using(
      'btree',
      table.userId.asc().nullsLast().op('uuid_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'user_notification_tokens_user_id_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    pgPolicy('Users can read their own tokens', {
      as: 'permissive',
      for: 'select',
      to: ['authenticated'],
      using: sql`(( SELECT auth.uid() AS uid) = user_id)`,
    }),
    pgPolicy('Users can insert their own tokens', {
      as: 'permissive',
      for: 'insert',
      to: ['authenticated'],
    }),
    pgPolicy('Users can delete their own tokens', {
      as: 'permissive',
      for: 'delete',
      to: ['authenticated'],
    }),
    pgPolicy('Users can update their own tokens', {
      as: 'permissive',
      for: 'update',
      to: ['authenticated'],
    }),
  ],
);




export const mediaGenre = pgView('media_genre', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  name: text(),
}).as(
  sql`SELECT g.id, ( SELECT gt.name FROM tmdb_genre_translation gt WHERE gt.genre = g.id ORDER BY ( CASE WHEN gt.language = (((language.requested_language).iso_639_1 || '-'::text) || (language.requested_language).iso_3166_1) THEN 1 WHEN gt.language = (((language.fallback_language).iso_639_1 || '-'::text) || (language.fallback_language).iso_3166_1) THEN 2 WHEN gt.language = (((language.default_language).iso_639_1 || '-'::text) || (language.default_language).iso_3166_1) THEN 3 ELSE 4 END) LIMIT 1) AS name FROM tmdb_genre g, LATERAL config.language() language(requested_language, fallback_language, default_language)`,
);

export const widgetMostPopular = pgMaterializedView('widget_most_popular', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  mediaId: bigint('media_id', { mode: 'number' }),
  type: userRecosType(),
  popularity: real(),
}).as(
  sql`SELECT m.id AS media_id, 'movie'::user_recos_type AS type, m.popularity FROM tmdb_movie m UNION ALL SELECT tv.id AS media_id, 'tv_series'::user_recos_type AS type, tv.popularity FROM tmdb_tv_series tv`,
);

export const userActivitiesMovieFollower = pgView(
  'user_activities_movie_follower',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    movieId: bigint('movie_id', { mode: 'number' }),
    userId: uuid('user_id'),
    isLiked: boolean('is_liked'),
    likedAt: timestamp('liked_at', { withTimezone: true, mode: 'string' }),
    rating: smallint(),
    ratedAt: timestamp('rated_at', { withTimezone: true, mode: 'string' }),
    watchedDate: timestamp('watched_date', {
      withTimezone: true,
      mode: 'string',
    }),
  },
)
  .with({ securityInvoker: true })
  .as(
    sql`SELECT ua.id, ua.created_at, ua.updated_at, ua.movie_id, ua.user_id, ua.is_liked, ua.liked_at, ua.rating, ua.rated_at, ua.watched_date FROM user_activities_movie ua JOIN user_follower uf ON ua.user_id = uf.followee_id WHERE uf.user_id = auth.uid() AND ua.user_id <> auth.uid()`,
  );

export const userActivitiesTvSeriesFollower = pgView(
  'user_activities_tv_series_follower',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    tvSeriesId: bigint('tv_series_id', { mode: 'number' }),
    userId: uuid('user_id'),
    isLiked: boolean('is_liked'),
    likedAt: timestamp('liked_at', { withTimezone: true, mode: 'string' }),
    rating: smallint(),
    ratedAt: timestamp('rated_at', { withTimezone: true, mode: 'string' }),
    watchedDate: timestamp('watched_date', {
      withTimezone: true,
      mode: 'string',
    }),
  },
)
  .with({ securityInvoker: true })
  .as(
    sql`SELECT ua.id, ua.created_at, ua.updated_at, ua.tv_series_id, ua.user_id, ua.is_liked, ua.liked_at, ua.rating, ua.rated_at, ua.watched_date FROM user_activities_tv_series ua JOIN user_follower uf ON ua.user_id = uf.followee_id WHERE uf.user_id = auth.uid() AND ua.user_id <> auth.uid()`,
  );

export const mediaPerson = pgView('media_person', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  name: text(),
  profilePath: text('profile_path'),
  profileUrl: text('profile_url'),
  birthday: date(),
  deathday: date(),
  homepage: text(),
  imdbId: text('imdb_id'),
  knownForDepartment: text('known_for_department'),
  placeOfBirth: text('place_of_birth'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  gender: bigint({ mode: 'number' }),
  biography: text(),
  popularity: real(),
  slug: text(),
  url: text(),
}).as(
  sql`SELECT person.id, person.name, person.profile_path, 'https://image.tmdb.org/t/p/original'::text || person.profile_path AS profile_url, person.birthday, person.deathday, person.homepage, person.imdb_id, person.known_for_department, person.place_of_birth, person.gender, person.biography, person.popularity, (person.id || '-'::text) || slugify(person.name) AS slug, ('/person/'::text || (person.id || '-'::text)) || slugify(person.name) AS url FROM ( SELECT c.id, c.gender, c.known_for_department, c.name, c.popularity, c.birthday, c.deathday, c.homepage, c.imdb_id, c.place_of_birth, ( SELECT ci.file_path FROM tmdb_person_image ci WHERE ci.person = c.id ORDER BY ci.vote_average DESC NULLS LAST LIMIT 1) AS profile_path, COALESCE(( SELECT NULLIF(t.biography, ''::text) AS "nullif" FROM tmdb_person_translation t WHERE t.person = c.id AND t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1), ( SELECT NULLIF(t.biography, ''::text) AS "nullif" FROM tmdb_person_translation t WHERE t.person = c.id AND t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1)) AS biography FROM tmdb_person c, LATERAL config.language() language(requested_language, fallback_language, default_language)) person`,
);

export const userActivitiesMovieFollowerAverageRating = pgView(
  'user_activities_movie_follower_average_rating',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    movieId: bigint('movie_id', { mode: 'number' }),
    followerAvgRating: numeric('follower_avg_rating'),
  },
).as(
  sql`SELECT ua.movie_id, avg(ua.rating) AS follower_avg_rating FROM user_activities_movie ua JOIN user_follower uf ON ua.user_id = uf.followee_id WHERE uf.user_id = auth.uid() GROUP BY ua.movie_id`,
);

export const userActivitiesTvSeriesFollowerAverageRating = pgView(
  'user_activities_tv_series_follower_average_rating',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    tvSeriesId: bigint('tv_series_id', { mode: 'number' }),
    followerAvgRating: numeric('follower_avg_rating'),
  },
).as(
  sql`SELECT ua.tv_series_id, avg(ua.rating) AS follower_avg_rating FROM user_activities_tv_series ua JOIN user_follower uf ON ua.user_id = uf.followee_id WHERE uf.user_id = auth.uid() GROUP BY ua.tv_series_id`,
);

export const userWatchlists = pgView('user_watchlists', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  userId: uuid('user_id'),
  status: watchlistStatus(),
  comment: text(),
  type: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  mediaId: bigint('media_id', { mode: 'number' }),
  media: jsonb(),
})
  .with({ securityInvoker: true })
  .as(
    sql`SELECT u.id, u.created_at, u.user_id, u.status, u.comment, 'movie'::text AS type, u.movie_id AS media_id, to_jsonb(m.*) AS media FROM user_watchlists_movie u LEFT JOIN media_movie m ON m.id = u.movie_id UNION ALL SELECT u.id, u.created_at, u.user_id, u.status, u.comment, 'tv_series'::text AS type, u.tv_series_id AS media_id, to_jsonb(t.*) AS media FROM user_watchlists_tv_series u LEFT JOIN media_tv_series t ON t.id = u.tv_series_id`,
  );

export const userWatchlistsRandom = pgView('user_watchlists_random', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  userId: uuid('user_id'),
  status: watchlistStatus(),
  comment: text(),
  type: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  mediaId: bigint('media_id', { mode: 'number' }),
  media: jsonb(),
})
  .with({ securityInvoker: true })
  .as(
    sql`SELECT user_watchlists.id, user_watchlists.created_at, user_watchlists.user_id, user_watchlists.status, user_watchlists.comment, user_watchlists.type, user_watchlists.media_id, user_watchlists.media FROM user_watchlists ORDER BY (random())`,
  );

export const userActivities = pgView('user_activities', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
  userId: uuid('user_id'),
  isLiked: boolean('is_liked'),
  likedAt: timestamp('liked_at', { withTimezone: true, mode: 'string' }),
  rating: smallint(),
  ratedAt: timestamp('rated_at', { withTimezone: true, mode: 'string' }),
  watchedDate: timestamp('watched_date', {
    withTimezone: true,
    mode: 'string',
  }),
  type: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  mediaId: bigint('media_id', { mode: 'number' }),
  media: jsonb(),
  review: jsonb(),
  user: jsonb(),
}).as(
  sql`SELECT uam.id, uam.created_at, uam.updated_at, uam.user_id, uam.is_liked, uam.liked_at, uam.rating, uam.rated_at, uam.watched_date, 'movie'::text AS type, uam.movie_id AS media_id, to_jsonb(m.*) AS media, to_jsonb(r.*) AS review, to_jsonb(u.*) AS "user" FROM user_activities_movie uam LEFT JOIN media_movie m ON m.id = uam.movie_id LEFT JOIN user_reviews_movie r ON r.id = uam.id LEFT JOIN profile u ON u.id = uam.user_id UNION ALL SELECT uat.id, uat.created_at, uat.updated_at, uat.user_id, uat.is_liked, uat.liked_at, uat.rating, uat.rated_at, uat.watched_date, 'tv_series'::text AS type, uat.tv_series_id AS media_id, to_jsonb(t.*) AS media, to_jsonb(r.*) AS review, to_jsonb(u.*) AS "user" FROM user_activities_tv_series uat LEFT JOIN media_tv_series t ON t.id = uat.tv_series_id LEFT JOIN user_reviews_tv_series r ON r.id = uat.id LEFT JOIN profile u ON u.id = uat.user_id`,
);

export const userRecosAggregated = pgView('user_recos_aggregated', {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  userId: uuid('user_id'),
  senders: json(),
  status: recoStatus(),
  type: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  mediaId: bigint('media_id', { mode: 'number' }),
  media: jsonb(),
})
  .with({ securityInvoker: true })
  .as(
    sql`SELECT u.created_at, u.user_id, u.senders, u.status, 'movie'::text AS type, u.movie_id AS media_id, to_jsonb(m.*) AS media FROM user_recos_movie_aggregated u LEFT JOIN media_movie m ON m.id = u.movie_id UNION ALL SELECT u.created_at, u.user_id, u.senders, u.status, 'tv_series'::text AS type, u.tv_series_id AS media_id, to_jsonb(t.*) AS media FROM user_recos_tv_series_aggregated u LEFT JOIN media_tv_series t ON t.id = u.tv_series_id`,
  );

export const userRecosAggregatedRandom = pgView(
  'user_recos_aggregated_random',
  {
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    userId: uuid('user_id'),
    senders: json(),
    status: recoStatus(),
    type: text(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    mediaId: bigint('media_id', { mode: 'number' }),
    media: jsonb(),
  },
)
  .with({ securityInvoker: true })
  .as(
    sql`SELECT user_recos_aggregated.created_at, user_recos_aggregated.user_id, user_recos_aggregated.senders, user_recos_aggregated.status, user_recos_aggregated.type, user_recos_aggregated.media_id, user_recos_aggregated.media FROM user_recos_aggregated ORDER BY (random())`,
  );

export const mediaTvSeriesEpisodes = pgView('media_tv_series_episodes', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  seasonId: bigint('season_id', { mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  serieId: bigint('serie_id', { mode: 'number' }),
  seasonNumber: integer('season_number'),
  episodeNumber: integer('episode_number'),
  name: text(),
  airDate: timestamp('air_date', { withTimezone: true, mode: 'string' }),
  episodeType: text('episode_type'),
  overview: text(),
  runtime: integer(),
  productionCode: text('production_code'),
  stillPath: text('still_path'),
  stillUrl: text('still_url'),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  url: text(),
}).as(
  sql`SELECT e.id, e.season_id, s.serie_id, s.season_number, e.episode_number, e.name, e.air_date, e.episode_type, e.overview, e.runtime, e.production_code, e.still_path, 'https://image.tmdb.org/t/p/original'::text || e.still_path AS still_url, e.vote_average, e.vote_count, (s.url || '/'::text) || e.episode_number::text AS url FROM tmdb_tv_series_episodes e JOIN media_tv_series_seasons s ON e.season_id = s.id`,
);

export const mediaTvSeries = pgView('media_tv_series', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  name: text(),
  posterPath: text('poster_path'),
  posterUrl: text('poster_url'),
  backdropPath: text('backdrop_path'),
  backdropUrl: text('backdrop_url'),
  createdBy: jsonb('created_by'),
  genres: jsonb(),
  firstAirDate: date('first_air_date'),
  lastAirDate: date('last_air_date'),
  overview: text(),
  numberOfEpisodes: integer('number_of_episodes'),
  numberOfSeasons: integer('number_of_seasons'),
  inProduction: boolean('in_production'),
  originalLanguage: text('original_language'),
  originalName: text('original_name'),
  status: text(),
  type: text(),
  popularity: real(),
  voteAverage: real('vote_average'),
  voteCount: real('vote_count'),
  slug: text(),
  url: text(),
  followerAvgRating: numeric('follower_avg_rating'),
}).as(
  sql`SELECT serie.id, COALESCE(serie.name, serie.original_name) AS name, serie.poster_path, 'https://image.tmdb.org/t/p/original'::text || serie.poster_path AS poster_url, serie.backdrop_path, 'https://image.tmdb.org/t/p/original'::text || serie.backdrop_path AS backdrop_url, serie.created_by, serie.genres, serie.first_air_date, serie.last_air_date, serie.overview, serie.number_of_episodes, serie.number_of_seasons, serie.in_production, serie.original_language, serie.original_name, serie.status, serie.type, serie.popularity, serie.vote_average, serie.vote_count, (serie.id || '-'::text) || slugify(serie.name) AS slug, ('/tv-series/'::text || (serie.id || '-'::text)) || slugify(serie.name) AS url, ( SELECT avg(ua.rating) AS follower_avg_rating FROM user_activities_tv_series ua JOIN user_follower uf ON ua.user_id = uf.followee_id WHERE uf.user_id = auth.uid() AND ua.tv_series_id = serie.id GROUP BY ua.tv_series_id) AS follower_avg_rating FROM ( SELECT s.id, COALESCE(( SELECT t.name FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1), ( SELECT t.name FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1), CASE WHEN (language.requested_language).iso_639_1 = s.original_language THEN s.original_name ELSE ( SELECT NULLIF(t.name, ''::text) AS "nullif" FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 LIMIT 1) END, s.original_name) AS name, COALESCE(( SELECT si.file_path FROM tmdb_tv_series_images si WHERE si.serie_id = s.id AND si.type = 'poster'::image_type AND si.iso_639_1 = (language.requested_language).iso_639_1 ORDER BY si.vote_average DESC NULLS LAST LIMIT 1), ( SELECT si.file_path FROM tmdb_tv_series_images si WHERE si.serie_id = s.id AND si.type = 'poster'::image_type AND si.iso_639_1 = s.original_language ORDER BY si.vote_average DESC NULLS LAST LIMIT 1), ( SELECT si.file_path FROM tmdb_tv_series_images si WHERE si.serie_id = s.id AND si.type = 'poster'::image_type ORDER BY si.vote_average DESC NULLS LAST LIMIT 1)) AS poster_path, ( SELECT si.file_path FROM tmdb_tv_series_images si WHERE si.serie_id = s.id AND si.type = 'backdrop'::image_type ORDER BY ( CASE WHEN si.iso_639_1 IS NULL THEN 1 WHEN si.iso_639_1 = (language.requested_language).iso_639_1 THEN 2 WHEN si.iso_639_1 = (language.fallback_language).iso_639_1 THEN 3 WHEN si.iso_639_1 = (language.default_language).iso_639_1 THEN 4 ELSE 5 END), si.vote_average DESC NULLS LAST LIMIT 1) AS backdrop_path, COALESCE(( SELECT NULLIF(t.overview, ''::text) AS "nullif" FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1), ( SELECT NULLIF(t.overview, ''::text) AS "nullif" FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1)) AS overview, ( SELECT array_agg(to_jsonb(p.*)) AS array_agg FROM tmdb_tv_series_credits sc JOIN media_person p ON sc.person_id = p.id WHERE sc.serie_id = s.id AND sc.job = 'Creator'::text) AS created_by, s.first_air_date, s.last_air_date, s.number_of_episodes, s.number_of_seasons, s.in_production, s.original_language, s.original_name, s.popularity, s.status, s.type, s.vote_average, s.vote_count, ( SELECT array_agg(jsonb_build_object('id', g.id, 'name', gt.name)) AS array_agg FROM tmdb_tv_series_genres sg JOIN tmdb_genre g ON sg.genre_id = g.id JOIN tmdb_genre_translation gt ON g.id = gt.genre WHERE sg.serie_id = s.id AND gt.language = (((language.requested_language).iso_639_1 || '-'::text) || (language.requested_language).iso_3166_1)) AS genres FROM tmdb_tv_series s, LATERAL config.language() language(requested_language, fallback_language, default_language)) serie`,
);

export const mediaTvSeriesSeasons = pgView('media_tv_series_seasons', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  serieId: bigint('serie_id', { mode: 'number' }),
  name: text(),
  posterPath: text('poster_path'),
  posterUrl: text('poster_url'),
  seasonNumber: integer('season_number'),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  episodeCount: bigint('episode_count', { mode: 'number' }),
  url: text(),
}).as(
  sql`SELECT season.id, season.serie_id, season.name, season.poster_path, 'https://image.tmdb.org/t/p/original'::text || season.poster_path AS poster_url, season.season_number, season.vote_average, season.vote_count, season.episode_count, (('/tv-series/'::text || season.serie_id::text) || '/'::text) || season.season_number::text AS url FROM ( SELECT s.id, s.serie_id, COALESCE(( SELECT t.name FROM tmdb_tv_series_seasons_translations t WHERE t.season_id = s.id AND t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1), ( SELECT t.name FROM tmdb_tv_series_seasons_translations t WHERE t.season_id = s.id AND t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1), ( SELECT NULLIF(t.name, ''::text) AS "nullif" FROM tmdb_tv_series_seasons_translations t WHERE t.season_id = s.id AND t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 LIMIT 1)) AS name, s.poster_path, s.season_number, s.vote_average, s.vote_count, ( SELECT count(*) AS count FROM tmdb_tv_series_episodes e WHERE e.season_id = s.id) AS episode_count FROM tmdb_tv_series_seasons s, LATERAL config.language() language(requested_language, fallback_language, default_language)) season`,
);

export const mediaMovieFull = pgView('media_movie_full', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  title: text(),
  posterPath: text('poster_path'),
  posterUrl: text('poster_url'),
  backdropPath: text('backdrop_path'),
  backdropUrl: text('backdrop_url'),
  directors: jsonb(),
  genres: jsonb(),
  releaseDate: timestamp('release_date', {
    withTimezone: true,
    mode: 'string',
  }),
  overview: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  budget: bigint({ mode: 'number' }),
  homepage: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  revenue: bigint({ mode: 'number' }),
  runtime: integer(),
  originalLanguage: text('original_language'),
  originalTitle: text('original_title'),
  status: text(),
  popularity: real(),
  voteAverage: real('vote_average'),
  voteCount: real('vote_count'),
  slug: text(),
  url: text(),
  followerAvgRating: numeric('follower_avg_rating'),
  trailers: json(),
}).as(
  sql`SELECT movie.id, COALESCE(movie.title, movie.original_title) AS title, movie.poster_path, 'https://image.tmdb.org/t/p/original'::text || movie.poster_path AS poster_url, movie.backdrop_path, 'https://image.tmdb.org/t/p/original'::text || movie.backdrop_path AS backdrop_url, movie.directors, movie.genres, movie.release_date, movie.overview, movie.budget, movie.homepage, movie.revenue, movie.runtime, movie.original_language, movie.original_title, movie.status, movie.popularity, movie.vote_average, movie.vote_count, (movie.id || '-'::text) || slugify(movie.title) AS slug, ('/film/'::text || (movie.id || '-'::text)) || slugify(movie.title) AS url, ( SELECT avg(ua.rating) AS follower_avg_rating FROM user_activities_movie ua JOIN user_follower uf ON ua.user_id = uf.followee_id WHERE uf.user_id = auth.uid() AND ua.movie_id = movie.id GROUP BY ua.movie_id) AS follower_avg_rating, movie.trailers FROM ( SELECT m.id, ( SELECT COALESCE(NULLIF(t.title, ''::text), CASE WHEN t.iso_639_1 = m.original_language THEN m.original_title ELSE NULL::text END, m.original_title) AS title FROM tmdb_movie_translations t WHERE t.movie_id = m.id ORDER BY ( CASE WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 WHEN t.iso_639_1 = m.original_language THEN 4 ELSE 5 END) LIMIT 1) AS title, ( SELECT mi.file_path FROM tmdb_movie_images mi WHERE mi.movie_id = m.id AND mi.type = 'poster'::image_type ORDER BY ( CASE WHEN mi.iso_639_1 = (language.requested_language).iso_639_1 THEN 1 WHEN mi.iso_639_1 = m.original_language THEN 2 ELSE 3 END), mi.vote_average DESC NULLS LAST LIMIT 1) AS poster_path, ( SELECT mi.file_path FROM tmdb_movie_images mi WHERE mi.movie_id = m.id AND mi.type = 'backdrop'::image_type ORDER BY ( CASE WHEN mi.iso_639_1 IS NULL THEN 1 WHEN mi.iso_639_1 = (language.requested_language).iso_639_1 THEN 2 WHEN mi.iso_639_1 = (language.fallback_language).iso_639_1 THEN 3 WHEN mi.iso_639_1 = (language.default_language).iso_639_1 THEN 4 ELSE 5 END), mi.vote_average DESC NULLS LAST LIMIT 1) AS backdrop_path, ( SELECT NULLIF(t.overview, ''::text) AS "nullif" FROM tmdb_movie_translations t WHERE t.movie_id = m.id ORDER BY ( CASE WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 ELSE 3 END) LIMIT 1) AS overview, m.budget, ( SELECT NULLIF(t.homepage, ''::text) AS "nullif" FROM tmdb_movie_translations t WHERE t.movie_id = m.id ORDER BY ( CASE WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 ELSE 4 END) LIMIT 1) AS homepage, m.revenue, ( SELECT t.runtime FROM tmdb_movie_translations t WHERE t.movie_id = m.id AND t.runtime <> 0 ORDER BY ( CASE WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 ELSE 4 END) LIMIT 1) AS runtime, m.original_language, m.original_title, m.popularity, m.vote_average, m.vote_count, ( SELECT r.release_date FROM tmdb_movie_release_dates r WHERE r.movie_id = m.id ORDER BY ( CASE WHEN r.release_type = ANY (ARRAY[2, 3]) THEN 1 WHEN r.release_type = 1 THEN 2 WHEN r.release_type = ANY (ARRAY[4, 5, 6]) THEN 3 ELSE 4 END), ( CASE WHEN r.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN r.iso_3166_1 = (language.default_language).iso_3166_1 THEN 2 ELSE 3 END), r.release_date LIMIT 1) AS release_date, m.status, ( SELECT array_agg(to_jsonb(p.*)) AS array_agg FROM tmdb_movie_credits mc JOIN media_person p ON mc.person_id = p.id WHERE mc.movie_id = m.id AND mc.job = 'Director'::text) AS directors, ( SELECT array_agg(jsonb_build_object('id', g.id, 'name', gt.name)) AS array_agg FROM tmdb_movie_genres mg JOIN tmdb_genre g ON mg.genre_id = g.id JOIN tmdb_genre_translation gt ON g.id = gt.genre WHERE mg.movie_id = m.id AND gt.language = (((language.requested_language).iso_639_1 || '-'::text) || (language.requested_language).iso_3166_1)) AS genres, ( SELECT json_agg(t.* ORDER BY t.lang_priority, t.published_at) AS json_agg FROM ( SELECT x.id, x.movie_id, x.iso_639_1, x.iso_3166_1, x.name, x.key, x.site, x.size, x.type, x.official, x.published_at, x.lang_priority, x.rn FROM ( SELECT v.id, v.movie_id, v.iso_639_1, v.iso_3166_1, v.name, v.key, v.site, v.size, v.type, v.official, v.published_at, CASE WHEN v.iso_639_1 = (language.requested_language).iso_639_1 THEN 1 WHEN v.iso_639_1 = m.original_language THEN 2 WHEN v.iso_639_1 = (language.default_language).iso_639_1 THEN 3 ELSE 4 END AS lang_priority, row_number() OVER (PARTITION BY v.iso_639_1 ORDER BY v.published_at) AS rn FROM tmdb_movie_videos v WHERE v.movie_id = m.id AND v.type = 'Trailer'::text AND (v.iso_639_1 = (language.requested_language).iso_639_1 OR v.iso_639_1 = m.original_language OR v.iso_639_1 = (language.default_language).iso_639_1 AND (language.default_language).iso_639_1 <> m.original_language)) x WHERE x.rn <= 2) t) AS trailers FROM tmdb_movie m, LATERAL config.language() language(requested_language, fallback_language, default_language)) movie`,
);

export const mediaTvSeriesFull = pgView('media_tv_series_full', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  name: text(),
  posterPath: text('poster_path'),
  posterUrl: text('poster_url'),
  backdropPath: text('backdrop_path'),
  backdropUrl: text('backdrop_url'),
  createdBy: jsonb('created_by'),
  genres: jsonb(),
  firstAirDate: date('first_air_date'),
  lastAirDate: date('last_air_date'),
  overview: text(),
  numberOfEpisodes: integer('number_of_episodes'),
  numberOfSeasons: integer('number_of_seasons'),
  inProduction: boolean('in_production'),
  originalLanguage: text('original_language'),
  originalName: text('original_name'),
  status: text(),
  type: text(),
  popularity: real(),
  voteAverage: real('vote_average'),
  voteCount: real('vote_count'),
  slug: text(),
  url: text(),
  followerAvgRating: numeric('follower_avg_rating'),
  trailers: json(),
}).as(
  sql`SELECT serie.id, COALESCE(serie.name, serie.original_name) AS name, serie.poster_path, 'https://image.tmdb.org/t/p/original'::text || serie.poster_path AS poster_url, serie.backdrop_path, 'https://image.tmdb.org/t/p/original'::text || serie.backdrop_path AS backdrop_url, serie.created_by, serie.genres, serie.first_air_date, serie.last_air_date, serie.overview, serie.number_of_episodes, serie.number_of_seasons, serie.in_production, serie.original_language, serie.original_name, serie.status, serie.type, serie.popularity, serie.vote_average, serie.vote_count, (serie.id || '-'::text) || slugify(serie.name) AS slug, ('/tv-series/'::text || (serie.id || '-'::text)) || slugify(serie.name) AS url, ( SELECT avg(ua.rating) AS follower_avg_rating FROM user_activities_tv_series ua JOIN user_follower uf ON ua.user_id = uf.followee_id WHERE uf.user_id = auth.uid() AND ua.tv_series_id = serie.id GROUP BY ua.tv_series_id) AS follower_avg_rating, serie.trailers FROM ( SELECT s.id, COALESCE(( SELECT t.name FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1), ( SELECT t.name FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1), CASE WHEN (language.requested_language).iso_639_1 = s.original_language THEN s.original_name ELSE ( SELECT NULLIF(t.name, ''::text) AS "nullif" FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 LIMIT 1) END, s.original_name) AS name, COALESCE(( SELECT si.file_path FROM tmdb_tv_series_images si WHERE si.serie_id = s.id AND si.type = 'poster'::image_type AND si.iso_639_1 = (language.requested_language).iso_639_1 ORDER BY si.vote_average DESC NULLS LAST LIMIT 1), ( SELECT si.file_path FROM tmdb_tv_series_images si WHERE si.serie_id = s.id AND si.type = 'poster'::image_type AND si.iso_639_1 = s.original_language ORDER BY si.vote_average DESC NULLS LAST LIMIT 1), ( SELECT si.file_path FROM tmdb_tv_series_images si WHERE si.serie_id = s.id AND si.type = 'poster'::image_type ORDER BY si.vote_average DESC NULLS LAST LIMIT 1)) AS poster_path, ( SELECT si.file_path FROM tmdb_tv_series_images si WHERE si.serie_id = s.id AND si.type = 'backdrop'::image_type ORDER BY ( CASE WHEN si.iso_639_1 IS NULL THEN 1 WHEN si.iso_639_1 = (language.requested_language).iso_639_1 THEN 2 WHEN si.iso_639_1 = (language.fallback_language).iso_639_1 THEN 3 WHEN si.iso_639_1 = (language.default_language).iso_639_1 THEN 4 ELSE 5 END), si.vote_average DESC NULLS LAST LIMIT 1) AS backdrop_path, COALESCE(( SELECT NULLIF(t.overview, ''::text) AS "nullif" FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1), ( SELECT NULLIF(t.overview, ''::text) AS "nullif" FROM tmdb_tv_series_translations t WHERE t.serie_id = s.id AND t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1)) AS overview, ( SELECT array_agg(to_jsonb(p.*)) AS array_agg FROM tmdb_tv_series_credits sc JOIN media_person p ON sc.person_id = p.id WHERE sc.serie_id = s.id AND sc.job = 'Creator'::text) AS created_by, s.first_air_date, s.last_air_date, s.number_of_episodes, s.number_of_seasons, s.in_production, s.original_language, s.original_name, s.popularity, s.status, s.type, s.vote_average, s.vote_count, ( SELECT array_agg(jsonb_build_object('id', g.id, 'name', gt.name)) AS array_agg FROM tmdb_tv_series_genres sg JOIN tmdb_genre g ON sg.genre_id = g.id JOIN tmdb_genre_translation gt ON g.id = gt.genre WHERE sg.serie_id = s.id AND gt.language = (((language.requested_language).iso_639_1 || '-'::text) || (language.requested_language).iso_3166_1)) AS genres, ( SELECT json_agg(t.* ORDER BY t.lang_priority, t.published_at) AS json_agg FROM ( SELECT x.id, x.serie_id, x.iso_639_1, x.iso_3166_1, x.name, x.key, x.site, x.size, x.type, x.official, x.published_at, x.lang_priority, x.rn FROM ( SELECT v.id, v.serie_id, v.iso_639_1, v.iso_3166_1, v.name, v.key, v.site, v.size, v.type, v.official, v.published_at, CASE WHEN v.iso_639_1 = (language.requested_language).iso_639_1 THEN 1 WHEN v.iso_639_1 = s.original_language THEN 2 WHEN v.iso_639_1 = (language.default_language).iso_639_1 THEN 3 ELSE 4 END AS lang_priority, row_number() OVER (PARTITION BY v.iso_639_1 ORDER BY v.published_at) AS rn FROM tmdb_tv_series_videos v WHERE v.serie_id = s.id AND v.type = 'Trailer'::text AND (v.iso_639_1 = (language.requested_language).iso_639_1 OR v.iso_639_1 = s.original_language OR v.iso_639_1 = (language.default_language).iso_639_1 AND (language.default_language).iso_639_1 <> s.original_language)) x WHERE x.rn <= 2) t) AS trailers FROM tmdb_tv_series s, LATERAL config.language() language(requested_language, fallback_language, default_language)) serie`,
);

export const mediaMovieAggregateCredits = pgView(
  'media_movie_aggregate_credits',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    movieId: bigint('movie_id', { mode: 'number' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    personId: bigint('person_id', { mode: 'number' }),
    credits: json(),
  },
).as(
  sql`SELECT mc.movie_id, mc.person_id, json_agg(json_build_object('credi_id', mc.id, 'department', mc.department, 'job', mc.job)) AS credits FROM tmdb_movie_credits mc GROUP BY mc.movie_id, mc.person_id`,
);

export const mediaMovie = pgView('media_movie', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  title: text(),
  posterPath: text('poster_path'),
  posterUrl: text('poster_url'),
  backdropPath: text('backdrop_path'),
  backdropUrl: text('backdrop_url'),
  directors: jsonb(),
  genres: jsonb(),
  releaseDate: timestamp('release_date', {
    withTimezone: true,
    mode: 'string',
  }),
  overview: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  budget: bigint({ mode: 'number' }),
  homepage: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  revenue: bigint({ mode: 'number' }),
  runtime: integer(),
  originalLanguage: text('original_language'),
  originalTitle: text('original_title'),
  status: text(),
  popularity: real(),
  voteAverage: real('vote_average'),
  voteCount: real('vote_count'),
  slug: text(),
  url: text(),
  followerAvgRating: numeric('follower_avg_rating'),
}).as(
  sql`SELECT movie.id, COALESCE(movie.title, movie.original_title) AS title, movie.poster_path, 'https://image.tmdb.org/t/p/original'::text || movie.poster_path AS poster_url, movie.backdrop_path, 'https://image.tmdb.org/t/p/original'::text || movie.backdrop_path AS backdrop_url, movie.directors, movie.genres, movie.release_date, movie.overview, movie.budget, movie.homepage, movie.revenue, movie.runtime, movie.original_language, movie.original_title, movie.status, movie.popularity, movie.vote_average, movie.vote_count, (movie.id || '-'::text) || slugify(movie.title) AS slug, ('/film/'::text || (movie.id || '-'::text)) || slugify(movie.title) AS url, ( SELECT avg(ua.rating) AS follower_avg_rating FROM user_activities_movie ua JOIN user_follower uf ON ua.user_id = uf.followee_id WHERE uf.user_id = auth.uid() AND ua.movie_id = movie.id GROUP BY ua.movie_id) AS follower_avg_rating FROM ( SELECT m.id, ( SELECT COALESCE(NULLIF(t.title, ''::text), CASE WHEN t.iso_639_1 = m.original_language THEN m.original_title ELSE NULL::text END, m.original_title) AS title FROM tmdb_movie_translations t WHERE t.movie_id = m.id ORDER BY ( CASE WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 WHEN t.iso_639_1 = m.original_language THEN 4 ELSE 5 END) LIMIT 1) AS title, ( SELECT mi.file_path FROM tmdb_movie_images mi WHERE mi.movie_id = m.id AND mi.type = 'poster'::image_type ORDER BY ( CASE WHEN mi.iso_639_1 = (language.requested_language).iso_639_1 THEN 1 WHEN mi.iso_639_1 = m.original_language THEN 2 ELSE 3 END), mi.vote_average DESC NULLS LAST LIMIT 1) AS poster_path, ( SELECT mi.file_path FROM tmdb_movie_images mi WHERE mi.movie_id = m.id AND mi.type = 'backdrop'::image_type ORDER BY ( CASE WHEN mi.iso_639_1 IS NULL THEN 1 WHEN mi.iso_639_1 = (language.requested_language).iso_639_1 THEN 2 WHEN mi.iso_639_1 = (language.fallback_language).iso_639_1 THEN 3 WHEN mi.iso_639_1 = (language.default_language).iso_639_1 THEN 4 ELSE 5 END), mi.vote_average DESC NULLS LAST LIMIT 1) AS backdrop_path, ( SELECT NULLIF(t.overview, ''::text) AS "nullif" FROM tmdb_movie_translations t WHERE t.movie_id = m.id ORDER BY ( CASE WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 ELSE 3 END) LIMIT 1) AS overview, m.budget, ( SELECT NULLIF(t.homepage, ''::text) AS "nullif" FROM tmdb_movie_translations t WHERE t.movie_id = m.id ORDER BY ( CASE WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 ELSE 4 END) LIMIT 1) AS homepage, m.revenue, ( SELECT t.runtime FROM tmdb_movie_translations t WHERE t.movie_id = m.id AND t.runtime <> 0 ORDER BY ( CASE WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 ELSE 4 END) LIMIT 1) AS runtime, m.original_language, m.original_title, m.popularity, m.vote_average, m.vote_count, ( SELECT r.release_date FROM tmdb_movie_release_dates r WHERE r.movie_id = m.id ORDER BY ( CASE WHEN r.release_type = ANY (ARRAY[2, 3]) THEN 1 WHEN r.release_type = 1 THEN 2 WHEN r.release_type = ANY (ARRAY[4, 5, 6]) THEN 3 ELSE 4 END), ( CASE WHEN r.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 WHEN r.iso_3166_1 = (language.default_language).iso_3166_1 THEN 2 ELSE 3 END), r.release_date LIMIT 1) AS release_date, m.status, ( SELECT array_agg(to_jsonb(p.*)) AS array_agg FROM tmdb_movie_credits mc JOIN media_person p ON mc.person_id = p.id WHERE mc.movie_id = m.id AND mc.job = 'Director'::text) AS directors, ( SELECT array_agg(jsonb_build_object('id', g.id, 'name', gt.name)) AS array_agg FROM tmdb_movie_genres mg JOIN tmdb_genre g ON mg.genre_id = g.id JOIN tmdb_genre_translation gt ON g.id = gt.genre WHERE mg.movie_id = m.id AND gt.language = (((language.requested_language).iso_639_1 || '-'::text) || (language.requested_language).iso_3166_1)) AS genres FROM tmdb_movie m, LATERAL config.language() language(requested_language, fallback_language, default_language)) movie`,
);

export const mediaCombinedCredits = pgMaterializedView(
  'media_combined_credits',
  {
    creditId: text('credit_id'),
    mediaType: mediaType('media_type'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    mediaId: bigint('media_id', { mode: 'number' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    personId: bigint('person_id', { mode: 'number' }),
    department: text(),
    job: text(),
    refDate: timestamp('ref_date', { withTimezone: true, mode: 'string' }),
  },
).as(
  sql`SELECT mc.id AS credit_id, 'movie'::media_type AS media_type, mc.movie_id AS media_id, mc.person_id, mc.department, mc.job, ( SELECT r.release_date FROM tmdb_movie_release_dates r WHERE r.movie_id = mc.movie_id ORDER BY ( CASE WHEN r.release_type = ANY (ARRAY[2, 3]) THEN 1 WHEN r.release_type = 1 THEN 2 WHEN r.release_type = ANY (ARRAY[4, 5, 6]) THEN 3 ELSE 4 END), r.release_date LIMIT 1) AS ref_date FROM tmdb_movie_credits mc UNION ALL SELECT c.id AS credit_id, 'tv_series'::media_type AS media_type, c.serie_id AS media_id, c.person_id, c.department, c.job, max(e.air_date) AS ref_date FROM tmdb_tv_series_credits c JOIN tmdb_tv_series_seasons_credits sc ON sc.credit_id = c.id JOIN tmdb_tv_series_episodes e ON e.season_id = sc.season_id GROUP BY c.id, c.serie_id, c.person_id, c.department, c.job`,
);

export const mediaMovieCasting = pgView('media_movie_casting', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  movieId: bigint('movie_id', { mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  personId: bigint('person_id', { mode: 'number' }),
  order: smallint(),
  credits: jsonb(),
}).as(
  sql`SELECT c.movie_id, c.person_id, min(r."order") AS "order", jsonb_agg(jsonb_build_object('credit_id', c.id, 'job', c.job, 'department', c.department, 'role', to_jsonb(r.*)) ORDER BY r."order") AS credits FROM tmdb_movie_credits c LEFT JOIN tmdb_movie_roles r ON r.credit_id = c.id WHERE c.job = 'Actor'::text GROUP BY c.movie_id, c.person_id`,
);

export const mediaTvSeriesCasting = pgView('media_tv_series_casting', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  serieId: bigint('serie_id', { mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  personId: bigint('person_id', { mode: 'number' }),
  order: smallint(),
  credits: jsonb(),
}).as(
  sql`SELECT c.serie_id, c.person_id, min(r."order") AS "order", jsonb_agg(jsonb_build_object('credit_id', c.id, 'job', c.job, 'department', c.department, 'role', to_jsonb(r.*)) ORDER BY r."order") AS credits FROM tmdb_tv_series_credits c LEFT JOIN tmdb_tv_series_roles r ON r.credit_id = c.id WHERE c.job = 'Actor'::text GROUP BY c.serie_id, c.person_id`,
);

export const mediaTvSeriesAggregateCredits = pgView(
  'media_tv_series_aggregate_credits',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    serieId: bigint('serie_id', { mode: 'number' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    personId: bigint('person_id', { mode: 'number' }),
    lastAppearanceDate: timestamp('last_appearance_date', {
      withTimezone: true,
      mode: 'string',
    }),
    credits: json(),
  },
).as(
  sql`SELECT c.serie_id, c.person_id, max(e.air_date) AS last_appearance_date, json_agg(json_build_object('credit_id', c.id, 'department', c.department, 'job', c.job, 'season_id', s.id, 'season_number', s.season_number)) AS credits FROM tmdb_tv_series_credits c JOIN tmdb_tv_series_seasons_credits sc ON sc.credit_id = c.id JOIN tmdb_tv_series_seasons s ON s.id = sc.season_id JOIN tmdb_tv_series_episodes e ON e.season_id = s.id GROUP BY c.serie_id, c.person_id`,
);

export const mediaMovieBackdrops = pgView('media_movie_backdrops', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  movieId: bigint('movie_id', { mode: 'number' }),
  filePath: text('file_path'),
  type: imageType(),
  aspectRatio: real('aspect_ratio'),
  height: integer(),
  width: integer(),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  iso6391: text('iso_639_1'),
  backdropUrl: text('backdrop_url'),
}).as(
  sql`SELECT mi.id, mi.movie_id, mi.file_path, mi.type, mi.aspect_ratio, mi.height, mi.width, mi.vote_average, mi.vote_count, mi.iso_639_1, 'https://image.tmdb.org/t/p/original'::text || mi.file_path AS backdrop_url FROM tmdb_movie_images mi, LATERAL config.language() language(requested_language, fallback_language, default_language) WHERE mi.type = 'backdrop'::image_type ORDER BY ( CASE WHEN mi.iso_639_1 IS NULL THEN 1 WHEN mi.iso_639_1 = (language.requested_language).iso_639_1 THEN 2 WHEN mi.iso_639_1 = (language.fallback_language).iso_639_1 THEN 3 WHEN mi.iso_639_1 = (language.default_language).iso_639_1 THEN 4 ELSE 5 END), mi.vote_average DESC NULLS LAST, mi.id`,
);

export const mediaCompany = pgView('media_company', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  name: text(),
  description: text(),
  logoPath: text('logo_path'),
  alternativeNames: json('alternative_names'),
  headquarters: text(),
  homepage: text(),
  originCountry: text('origin_country'),
  parentCompany: json('parent_company'),
}).as(
  sql`SELECT c.id, c.name, c.description, ( SELECT ci.file_path FROM tmdb_company_image ci WHERE ci.company = c.id ORDER BY ci.vote_average DESC NULLS LAST LIMIT 1) AS logo_path, ( SELECT json_agg(an.name) AS json_agg FROM tmdb_company_alternative_name an WHERE an.company = c.id) AS alternative_names, c.headquarters, c.homepage, c.origin_country, CASE WHEN c.parent_company IS NOT NULL THEN json_build_object('id', parent.id, 'name', parent.name) ELSE NULL::json END AS parent_company FROM tmdb_company c LEFT JOIN tmdb_company parent ON c.parent_company = parent.id`,
);

export const mediaCollection = pgView('media_collection', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  name: text(),
  overview: text(),
  homepage: text(),
  posterPath: text('poster_path'),
  backdropPath: text('backdrop_path'),
}).as(
  sql`SELECT c.id, COALESCE(( SELECT NULLIF(t.title, ''::text) AS "nullif" FROM tmdb_collection_translation t WHERE t.collection = c.id AND t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1), ( SELECT NULLIF(t.title, ''::text) AS "nullif" FROM tmdb_collection_translation t WHERE t.collection = c.id AND t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1), ( SELECT NULLIF(t.title, ''::text) AS "nullif" FROM tmdb_collection_translation t WHERE t.collection = c.id AND t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 LIMIT 1), c.name) AS name, COALESCE(( SELECT NULLIF(t.overview, ''::text) AS "nullif" FROM tmdb_collection_translation t WHERE t.collection = c.id AND t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1), ( SELECT NULLIF(t.overview, ''::text) AS "nullif" FROM tmdb_collection_translation t WHERE t.collection = c.id AND t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1)) AS overview, COALESCE(( SELECT NULLIF(t.homepage, ''::text) AS "nullif" FROM tmdb_collection_translation t WHERE t.collection = c.id AND t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1), ( SELECT NULLIF(t.homepage, ''::text) AS "nullif" FROM tmdb_collection_translation t WHERE t.collection = c.id AND t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1), ( SELECT NULLIF(t.homepage, ''::text) AS "nullif" FROM tmdb_collection_translation t WHERE t.collection = c.id AND t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 LIMIT 1)) AS homepage, COALESCE(( SELECT ci.file_path FROM tmdb_collection_image ci WHERE ci.collection = c.id AND ci.type = 'poster'::image_type AND ci.iso_639_1 = (language.requested_language).iso_639_1 ORDER BY ci.vote_average DESC NULLS LAST LIMIT 1), ( SELECT ci.file_path FROM tmdb_collection_image ci WHERE ci.collection = c.id AND ci.type = 'poster'::image_type ORDER BY ci.vote_average DESC NULLS LAST LIMIT 1)) AS poster_path, ( SELECT ci.file_path FROM tmdb_collection_image ci WHERE ci.collection = c.id AND ci.type = 'backdrop'::image_type ORDER BY ci.vote_average DESC NULLS LAST LIMIT 1) AS backdrop_path FROM tmdb_collection c, LATERAL config.language() language(requested_language, fallback_language, default_language)`,
);

export const mediaPersonJobs = pgView('media_person_jobs', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  personId: bigint('person_id', { mode: 'number' }),
  department: text(),
  jobs: text(),
}).as(
  sql`SELECT tmdb_movie_credits.person_id, tmdb_movie_credits.department, array_agg(DISTINCT tmdb_movie_credits.job) AS jobs FROM tmdb_movie_credits GROUP BY tmdb_movie_credits.person_id, tmdb_movie_credits.department`,
);

export const widgetMostRecommended = pgMaterializedView(
  'widget_most_recommended',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    mediaId: bigint('media_id', { mode: 'number' }),
    type: userRecosType(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    recommendationCount: bigint('recommendation_count', { mode: 'number' }),
  },
).as(
  sql`SELECT recos.media_id, recos.type, count(*) AS recommendation_count FROM ( SELECT ur_movie.movie_id AS media_id, 'movie'::user_recos_type AS type FROM user_recos_movie ur_movie WHERE ur_movie.created_at > (now() - '30 days'::interval) UNION ALL SELECT ur_tv.tv_series_id AS media_id, 'tv_series'::user_recos_type AS type FROM user_recos_tv_series ur_tv WHERE ur_tv.created_at > (now() - '30 days'::interval)) recos GROUP BY recos.media_id, recos.type`,
);

export const mediaTvSeriesBackdrops = pgView('media_tv_series_backdrops', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  serieId: bigint('serie_id', { mode: 'number' }),
  filePath: text('file_path'),
  type: imageType(),
  aspectRatio: real('aspect_ratio'),
  height: integer(),
  width: integer(),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  iso6391: text('iso_639_1'),
  backdropUrl: text('backdrop_url'),
}).as(
  sql`SELECT tvi.id, tvi.serie_id, tvi.file_path, tvi.type, tvi.aspect_ratio, tvi.height, tvi.width, tvi.vote_average, tvi.vote_count, tvi.iso_639_1, 'https://image.tmdb.org/t/p/original'::text || tvi.file_path AS backdrop_url FROM tmdb_tv_series_images tvi, LATERAL config.language() language(requested_language, fallback_language, default_language) WHERE tvi.type = 'backdrop'::image_type ORDER BY ( CASE WHEN tvi.iso_639_1 IS NULL THEN 1 WHEN tvi.iso_639_1 = (language.requested_language).iso_639_1 THEN 2 WHEN tvi.iso_639_1 = (language.fallback_language).iso_639_1 THEN 3 WHEN tvi.iso_639_1 = (language.default_language).iso_639_1 THEN 4 ELSE 5 END), tvi.vote_average DESC NULLS LAST, tvi.id`,
);

export const mediaTvSeriesPosters = pgView('media_tv_series_posters', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  serieId: bigint('serie_id', { mode: 'number' }),
  filePath: text('file_path'),
  type: imageType(),
  aspectRatio: real('aspect_ratio'),
  height: integer(),
  width: integer(),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  iso6391: text('iso_639_1'),
  posterUrl: text('poster_url'),
}).as(
  sql`SELECT tvi.id, tvi.serie_id, tvi.file_path, tvi.type, tvi.aspect_ratio, tvi.height, tvi.width, tvi.vote_average, tvi.vote_count, tvi.iso_639_1, 'https://image.tmdb.org/t/p/original'::text || tvi.file_path AS poster_url FROM tmdb_tv_series_images tvi, LATERAL config.language() language(requested_language, fallback_language, default_language) WHERE tvi.type = 'poster'::image_type ORDER BY ( CASE WHEN tvi.iso_639_1 = (language.requested_language).iso_639_1 THEN 1 WHEN tvi.iso_639_1 = (language.fallback_language).iso_639_1 THEN 2 WHEN tvi.iso_639_1 = (language.default_language).iso_639_1 THEN 3 WHEN tvi.iso_639_1 IS NULL THEN 4 ELSE 5 END), tvi.vote_average DESC NULLS LAST, tvi.id`,
);

export const tmdbPersonDepartment = pgView('tmdb_person_department', {
  department: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  personId: bigint('person_id', { mode: 'number' }),
}).as(
  sql`SELECT DISTINCT tmdb_movie_credits.department, tmdb_movie_credits.person_id FROM tmdb_movie_credits`,
);

export const tmdbMovieCreditsRandom = pgView('tmdb_movie_credits_random', {
  id: text(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  movieId: bigint('movie_id', { mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  personId: bigint('person_id', { mode: 'number' }),
  department: text(),
  job: text(),
}).as(
  sql`SELECT tmdb_movie_credits.id, tmdb_movie_credits.movie_id, tmdb_movie_credits.person_id, tmdb_movie_credits.department, tmdb_movie_credits.job FROM tmdb_movie_credits ORDER BY (random())`,
);

export const mediaMoviePosters = pgView('media_movie_posters', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  movieId: bigint('movie_id', { mode: 'number' }),
  filePath: text('file_path'),
  type: imageType(),
  aspectRatio: real('aspect_ratio'),
  height: integer(),
  width: integer(),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  iso6391: text('iso_639_1'),
  posterUrl: text('poster_url'),
}).as(
  sql`SELECT mi.id, mi.movie_id, mi.file_path, mi.type, mi.aspect_ratio, mi.height, mi.width, mi.vote_average, mi.vote_count, mi.iso_639_1, 'https://image.tmdb.org/t/p/original'::text || mi.file_path AS poster_url FROM tmdb_movie_images mi, LATERAL config.language() language(requested_language, fallback_language, default_language) WHERE mi.type = 'poster'::image_type ORDER BY ( CASE WHEN mi.iso_639_1 = (language.requested_language).iso_639_1 THEN 1 WHEN mi.iso_639_1 = (language.fallback_language).iso_639_1 THEN 2 WHEN mi.iso_639_1 = (language.default_language).iso_639_1 THEN 3 WHEN mi.iso_639_1 IS NULL THEN 4 ELSE 5 END), mi.vote_average DESC NULLS LAST, mi.id`,
);

export const userFeedCastCrew = pgView('user_feed_cast_crew', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  personId: bigint('person_id', { mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  movieId: bigint('movie_id', { mode: 'number' }),
  jobs: text(),
}).as(
  sql`SELECT mc.person_id, mc.movie_id, mc.jobs FROM ( SELECT mc_1.person_id, mc_1.movie_id, array_agg(mc_1.job) AS jobs FROM tmdb_movie_credits mc_1 WHERE (mc_1.person_id IN ( SELECT upf.person_id FROM user_person_follower upf WHERE upf.user_id = auth.uid())) GROUP BY mc_1.person_id, mc_1.movie_id) mc WHERE (EXISTS ( SELECT 1 FROM "user" u WHERE u.id = auth.uid() AND u.premium = true))`,
);

export const userRecosTvSeriesAggregated = pgView(
  'user_recos_tv_series_aggregated',
  {
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    userId: uuid('user_id'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    tvSeriesId: bigint('tv_series_id', { mode: 'number' }),
    senders: json(),
    status: recoStatus(),
  },
)
  .with({ securityInvoker: true })
  .as(
    sql`SELECT min(ur.created_at) AS created_at, ur.user_id, ur.tv_series_id, array_agg(json_build_object('user', row_to_json(p.*), 'comment', ur.comment, 'created_at', ur.created_at) ORDER BY ur.created_at) AS senders, ur.status FROM user_recos_tv_series ur JOIN profile p ON ur.sender_id = p.id GROUP BY ur.user_id, ur.tv_series_id, ur.status`,
  );

export const userRecosMovieAggregated = pgView('user_recos_movie_aggregated', {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  userId: uuid('user_id'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  movieId: bigint('movie_id', { mode: 'number' }),
  senders: json(),
  status: recoStatus(),
})
  .with({ securityInvoker: true })
  .as(
    sql`SELECT min(ur.created_at) AS created_at, ur.user_id, ur.movie_id, array_agg(json_build_object('user', row_to_json(p.*), 'comment', ur.comment, 'created_at', ur.created_at) ORDER BY ur.created_at) AS senders, ur.status FROM user_recos_movie ur JOIN profile p ON ur.sender_id = p.id GROUP BY ur.user_id, ur.movie_id, ur.status`,
  );

export const playlistsFriends = pgView('playlists_friends', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  id: bigint({ mode: 'number' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
  userId: uuid('user_id'),
  title: text(),
  description: text(),
  posterUrl: text('poster_url'),
  private: boolean(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  itemsCount: bigint('items_count', { mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  savedCount: bigint('saved_count', { mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  likesCount: bigint('likes_count', { mode: 'number' }),
  type: playlistsType(),
})
  .with({ securityInvoker: 'on' })
  .as(
    sql`SELECT DISTINCT p.id, p.created_at, p.updated_at, p.user_id, p.title, p.description, p.poster_url, p.private, p.items_count, p.saved_count, p.likes_count, p.type FROM playlists p JOIN user_follower uf ON uf.followee_id = p.user_id WHERE uf.user_id = auth.uid()`,
  );

export const userRecosMovieAggregatedRandom = pgView(
  'user_recos_movie_aggregated_random',
  {
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    userId: uuid('user_id'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    movieId: bigint('movie_id', { mode: 'number' }),
    senders: json(),
    status: recoStatus(),
  },
)
  .with({ securityInvoker: true })
  .as(
    sql`SELECT min(ur.created_at) AS created_at, ur.user_id, ur.movie_id, array_agg(json_build_object('user', row_to_json(p.*), 'comment', ur.comment, 'created_at', ur.created_at) ORDER BY ur.created_at) AS senders, ur.status FROM user_recos_movie ur JOIN profile p ON ur.sender_id = p.id GROUP BY ur.user_id, ur.movie_id, ur.status ORDER BY (random())`,
  );

export const userRecosTvSeriesAggregatedRandom = pgView(
  'user_recos_tv_series_aggregated_random',
  {
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
    userId: uuid('user_id'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    tvSeriesId: bigint('tv_series_id', { mode: 'number' }),
    senders: json(),
    status: recoStatus(),
  },
)
  .with({ securityInvoker: true })
  .as(
    sql`SELECT min(ur.created_at) AS created_at, ur.user_id, ur.tv_series_id, array_agg(json_build_object('user', row_to_json(p.*), 'comment', ur.comment, 'created_at', ur.created_at) ORDER BY ur.created_at) AS senders, ur.status FROM user_recos_tv_series ur JOIN profile p ON ur.sender_id = p.id GROUP BY ur.user_id, ur.tv_series_id, ur.status ORDER BY (random())`,
  );

export const profile = pgView('profile', {
  id: uuid(),
  // TODO: failed to parse database type 'citext'
  username: unknown('username'),
  fullName: text('full_name'),
  bio: text(),
  avatarUrl: text('avatar_url'),
  website: text(),
  favoriteColor: text('favorite_color'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  followersCount: bigint('followers_count', { mode: 'number' }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  followingCount: bigint('following_count', { mode: 'number' }),
  backgroundUrl: text('background_url'),
  premium: boolean(),
  private: boolean(),
  visible: boolean(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
}).as(
  sql`SELECT u.id, u.username, u.full_name, u.bio, u.avatar_url, u.website, u.favorite_color, u.followers_count, u.following_count, u.background_url, u.premium, u.private, (( SELECT auth.uid() AS uid)) = u.id OR NOT u.private OR utils_check_user_following(( SELECT auth.uid() AS uid), u.id) AS visible, u.created_at FROM "user" u`,
);
