import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { UpdateFollowCountsDto, UpdatePlaylistItemsDto, UpdatePlaylistLikesDto, UpdatePlaylistSavesDto, UpdateReviewMovieLikesDto, UpdateReviewTvSeriesLikesDto } from '@shared/worker';
import { playlist, profile, reviewMovie, reviewTvSeries } from '@libs/db/schemas';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class CountersService {
	private readonly logger = new Logger(CountersService.name);

	constructor(
		@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
	) {}

	async updateFollowCounts(data: UpdateFollowCountsDto) {
		const { followerId, followingId, action, amount } = data;

		const followingUpdateSql = action === 'increment'
            ? sql`${profile.followingCount} + ${amount}`
            : sql`GREATEST(${profile.followingCount} - ${amount}, 0)`;

        const followersUpdateSql = action === 'increment'
            ? sql`${profile.followersCount} + ${amount}`
            : sql`GREATEST(${profile.followersCount} - ${amount}, 0)`;

		await this.db.transaction(async (tx) => {
			await tx.update(profile)
				.set({ followingCount: followingUpdateSql })
				.where(eq(profile.id, followerId));

			await tx.update(profile)
				.set({ followersCount: followersUpdateSql })
				.where(eq(profile.id, followingId));
		});
	}

	async updateReviewMovieLikes(data: UpdateReviewMovieLikesDto) {
		const { reviewId, action, amount } = data;

		const likesUpdateSql = action === 'increment'
			? sql`${reviewMovie.likesCount} + ${amount}`
			: sql`GREATEST(${reviewMovie.likesCount} - ${amount}, 0)`;

		await this.db.update(reviewMovie)
			.set({ likesCount: likesUpdateSql })
			.where(eq(reviewMovie.id, reviewId));
	}

	async updateReviewTvSeriesLikes(data: UpdateReviewTvSeriesLikesDto) {
		const { reviewId, action, amount } = data;

		const likesUpdateSql = action === 'increment'
			? sql`${reviewTvSeries.likesCount} + ${amount}`
			: sql`GREATEST(${reviewTvSeries.likesCount} - ${amount}, 0)`;

		await this.db.update(reviewTvSeries)
			.set({ likesCount: likesUpdateSql })
			.where(eq(reviewTvSeries.id, reviewId));
	}

	async updatePlaylistItems(data: UpdatePlaylistItemsDto) {
		const { playlistId, action, amount } = data;

		const itemsUpdateSql = action === 'increment'
			? sql`${playlist.itemsCount} + ${amount}`
			: sql`GREATEST(${playlist.itemsCount} - ${amount}, 0)`;

		await this.db.update(playlist)
			.set({ itemsCount: itemsUpdateSql })
			.where(eq(playlist.id, playlistId));
	}

	async updatePlaylistLikes(data: UpdatePlaylistLikesDto) {
		const { playlistId, action, amount } = data;

		const likesUpdateSql = action === 'increment'
			? sql`${playlist.likesCount} + ${amount}`
			: sql`GREATEST(${playlist.likesCount} - ${amount}, 0)`;

		await this.db.update(playlist)
			.set({ likesCount: likesUpdateSql })
			.where(eq(playlist.id, playlistId));
	}

	async updatePlaylistSaves(data: UpdatePlaylistSavesDto) {
		const { playlistId, action, amount } = data;

		const savedUpdateSql = action === 'increment'
			? sql`${playlist.savedCount} + ${amount}`
			: sql`GREATEST(${playlist.savedCount} - ${amount}, 0)`;

		await this.db.update(playlist)
			.set({ savedCount: savedUpdateSql })
			.where(eq(playlist.id, playlistId));
	}
}