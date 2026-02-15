import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { TYPESENSE_CLIENT } from '../../common/modules/typesense.module';
import { Client as TypesenseClient } from 'typesense';
import { eq } from 'drizzle-orm';
import { user } from '@libs/db/schemas';

@Injectable()
export class SearchService {
	private readonly logger = new Logger(SearchService.name);

	constructor(
		@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
		@Inject(TYPESENSE_CLIENT) private readonly typesense: TypesenseClient,
	) {}

	async syncUser(userId: string) {
		this.logger.log(`Syncing user ${userId} to Typesense...`);
		const profile = await this.db.query.user.findFirst({
			where: (eq(user.id, userId)),
			columns: {
				id: true,
				username: true,
				name: true,
			},
			with: {
				profile: {
					columns: {
						followersCount: true,
					}
				}
			}
		});
		
		if (!profile) {
			this.logger.warn(`User ${userId} not found in database`);
			return;
		}

		const document = {
			id: profile.id,
			username: profile.username,
			name: profile.name,
			followers_count: profile.profile?.followersCount || 0,
		};

		await this.typesense.collections('users').documents().upsert(document);
		this.logger.log(`User ${userId} synced to Typesense successfully`);
	}

	async syncPlaylist(playlistId: string) {
		this.logger.log(`Syncing playlist ${playlistId} to Typesense...`);
		// 1. Fetch playlist from Drizzle (with member_ids)
		// 2. Format to match Typesense schema
		// 3. Upsert into Typesense 'playlists' collection
	}
}