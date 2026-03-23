import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { playlist, profile, reviewMovie, reviewTvSeries } from '@libs/db/schemas';
import { eq, sql } from 'drizzle-orm';
import { CountersRegistry } from '@shared/worker';
import { Client as TypesenseClient } from 'typesense';
import { TYPESENSE_CLIENT } from '../../common/modules/typesense.module';

@Injectable()
export class CountersService {
	private readonly logger = new Logger(CountersService.name);

	constructor(
		@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
		@Inject(TYPESENSE_CLIENT) private readonly typesense: TypesenseClient,
	) {}

	async updateFollowCounts(data: CountersRegistry['counters:update-follow']) {
        const { followerId, followingId, action, amount } = data;

        const followingUpdateSql = action === 'increment'
            ? sql`${profile.followingCount} + ${amount}`
            : sql`GREATEST(${profile.followingCount} - ${amount}, 0)`;

        const followersUpdateSql = action === 'increment'
            ? sql`${profile.followersCount} + ${amount}`
            : sql`GREATEST(${profile.followersCount} - ${amount}, 0)`;

        const { updatedFollowing } = await this.db.transaction(async (tx) => {
            await tx.update(profile)
                .set({ followingCount: followingUpdateSql })
                .where(eq(profile.id, followerId));

            const [following] = await tx.update(profile)
                .set({ followersCount: followersUpdateSql })
                .where(eq(profile.id, followingId))
                .returning({ followersCount: profile.followersCount });

            return { updatedFollowing: following };
        });

        try {
            if (updatedFollowing) {
                await this.typesense.collections('users').documents(followingId).update({
                    followers_count: updatedFollowing.followersCount,
                });
            }
        } catch (error) {
            this.logger.error(`Erreur Typesense (updateFollowCounts): ${error.message}`);
        }
    }

	async updateReviewMovieLikes(data: CountersRegistry['counters:update-review-movie-likes']) {
		const { reviewId, action, amount } = data;

		const likesUpdateSql = action === 'increment'
			? sql`${reviewMovie.likesCount} + ${amount}`
			: sql`GREATEST(${reviewMovie.likesCount} - ${amount}, 0)`;

		await this.db.update(reviewMovie)
			.set({ likesCount: likesUpdateSql })
			.where(eq(reviewMovie.id, reviewId));
	}

	async updateReviewTvSeriesLikes(data: CountersRegistry['counters:update-review-tv-series-likes']) {
		const { reviewId, action, amount } = data;

		const likesUpdateSql = action === 'increment'
			? sql`${reviewTvSeries.likesCount} + ${amount}`
			: sql`GREATEST(${reviewTvSeries.likesCount} - ${amount}, 0)`;

		await this.db.update(reviewTvSeries)
			.set({ likesCount: likesUpdateSql })
			.where(eq(reviewTvSeries.id, reviewId));
	}

	async updatePlaylistItems(data: CountersRegistry['counters:update-playlist-items']) {
        const { playlistId, action, amount } = data;

        const itemsUpdateSql = action === 'increment'
            ? sql`${playlist.itemsCount} + ${amount}`
            : sql`GREATEST(${playlist.itemsCount} - ${amount}, 0)`;

        const [updatedPlaylist] = await this.db.update(playlist)
            .set({ itemsCount: itemsUpdateSql })
            .where(eq(playlist.id, playlistId))
            .returning({ itemsCount: playlist.itemsCount });

        try {
            if (updatedPlaylist) {
                await this.typesense.collections('playlists').documents(playlistId.toString()).update({
                    items_count: updatedPlaylist.itemsCount,
                });
            }
        } catch (error) {
            this.logger.error(`Erreur Typesense (updatePlaylistItems): ${error.message}`);
        }
    }

	async updatePlaylistLikes(data: CountersRegistry['counters:update-playlist-likes']) {
        const { playlistId, action, amount } = data;

        const likesUpdateSql = action === 'increment'
            ? sql`${playlist.likesCount} + ${amount}`
            : sql`GREATEST(${playlist.likesCount} - ${amount}, 0)`;

        const [updatedPlaylist] = await this.db.update(playlist)
            .set({ likesCount: likesUpdateSql })
            .where(eq(playlist.id, playlistId))
            .returning({ likesCount: playlist.likesCount });

        try {
            if (updatedPlaylist) {
                await this.typesense.collections('playlists').documents(playlistId.toString()).update({
                    likes_count: updatedPlaylist.likesCount,
                });
            }
        } catch (error) {
            this.logger.error(`Erreur Typesense (updatePlaylistLikes): ${error.message}`);
        }
    }

	async updatePlaylistSaves(data: CountersRegistry['counters:update-playlist-saves']) {
        const { playlistId, action, amount } = data;

        const savedUpdateSql = action === 'increment'
            ? sql`${playlist.savedCount} + ${amount}`
            : sql`GREATEST(${playlist.savedCount} - ${amount}, 0)`;

        await this.db.update(playlist)
            .set({ savedCount: savedUpdateSql })
            .where(eq(playlist.id, playlistId));
    }
}