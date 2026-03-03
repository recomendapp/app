import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { UpdateFollowCountsDto, UpdatePlaylistLikesDto, UpdatePlaylistSavesDto, UpdateReviewMovieLikesDto, UpdateReviewTvSeriesLikesDto } from '@shared/worker';
import { playlist, profile, reviewMovie, reviewTvSeries } from '@libs/db/schemas';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export class CountersService {
	private readonly logger = new Logger(CountersService.name);

	constructor(
		@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
	) {}

	async updateFollowCounts(data: UpdateFollowCountsDto) {
		const { followerId, followingId, action } = data;

		const followingUpdateSql = action === 'increment'
            ? sql`${profile.followingCount} + 1`
            : sql`GREATEST(${profile.followingCount} - 1, 0)`;

        const followersUpdateSql = action === 'increment'
            ? sql`${profile.followersCount} + 1`
            : sql`GREATEST(${profile.followersCount} - 1, 0)`;

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
		const { reviewId, action } = data;

		const likesUpdateSql = action === 'increment'
			? sql`${reviewMovie.likesCount} + 1`
			: sql`GREATEST(${reviewMovie.likesCount} - 1, 0)`;

		await this.db.update(reviewMovie)
			.set({ likesCount: likesUpdateSql })
			.where(eq(reviewMovie.id, reviewId));
	}

	async updateReviewTvSeriesLikes(data: UpdateReviewTvSeriesLikesDto) {
		const { reviewId, action } = data;

		const likesUpdateSql = action === 'increment'
			? sql`${reviewTvSeries.likesCount} + 1`
			: sql`GREATEST(${reviewTvSeries.likesCount} - 1, 0)`;

		await this.db.update(reviewTvSeries)
			.set({ likesCount: likesUpdateSql })
			.where(eq(reviewTvSeries.id, reviewId));
	}

	async updatePlaylistLikes(data: UpdatePlaylistLikesDto) {
		const { playlistId, action } = data;

		const likesUpdateSql = action === 'increment'
			? sql`${playlist.likesCount} + 1`
			: sql`GREATEST(${playlist.likesCount} - 1, 0)`;

		await this.db.update(playlist)
			.set({ likesCount: likesUpdateSql })
			.where(eq(playlist.id, playlistId));
	}

	async updatePlaylistSaves(data: UpdatePlaylistSavesDto) {
		const { playlistId, action } = data;

		const savedUpdateSql = action === 'increment'
			? sql`${playlist.savedCount} + 1`
			: sql`GREATEST(${playlist.savedCount} - 1, 0)`;

		await this.db.update(playlist)
			.set({ savedCount: savedUpdateSql })
			.where(eq(playlist.id, playlistId));
	}
}