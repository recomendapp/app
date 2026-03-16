import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { and, eq } from 'drizzle-orm';
import { feed } from '@libs/db/schemas';
import { FeedRegistry } from '@shared/worker';

@Injectable()
export class FeedService {
	private readonly logger = new Logger(FeedService.name);

	constructor(
		@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
	) {}

	async insertActivity(data: FeedRegistry['feed:insert-activity']) {
		const { userId, activityId, activityType } = data;

		await this.db.insert(feed).values({
			userId,
			activityId,
			activityType,
		}).onConflictDoNothing();
	}

	async deleteActivity(data: FeedRegistry['feed:delete-activity']) {
		const { activityId, activityType } = data;

		await this.db.delete(feed).where(
			and(
				eq(feed.activityId, activityId),
				eq(feed.activityType, activityType),
			)
		);
	}
}