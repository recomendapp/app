import { Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle.module';
import { TYPESENSE_CLIENT } from '../../common/modules/typesense.module';
import { Client as TypesenseClient } from 'typesense';
import { eq } from 'drizzle-orm';
import { playlist, user } from '@libs/db/schemas';
import { SearchRegistry } from '@shared/worker';

@Injectable()
export class SearchService {
	private readonly logger = new Logger(SearchService.name);

	constructor(
		@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
		@Inject(TYPESENSE_CLIENT) private readonly typesense: TypesenseClient,
	) {}

	async syncUser({ userId, action }: SearchRegistry['search:sync-user']) {
		this.logger.log(`Syncing user ${userId} to Typesense...`);
		switch (action) {
			case 'delete': {
				try {
					await this.typesense.collections('users').documents(userId.toString()).delete();
					this.logger.log(`User ${userId} deleted from Typesense successfully`);
				} catch (error) {
					this.logger.error(`Failed to delete user ${userId} from Typesense: ${error.message}`);
				}
				break;
			}
			case 'upsert': {
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
				break;
			}
		}
		this.logger.log(`User ${userId} synced to Typesense successfully`);
	}

	async syncPlaylist({ playlistId, action }: SearchRegistry['search:sync-playlist']) {
		this.logger.log(`Syncing playlist ${playlistId} to Typesense...`);     
		switch (action) {
			case 'delete': {
				try {
					await this.typesense.collections('playlists').documents(playlistId.toString()).delete();
					this.logger.log(`Playlist ${playlistId} deleted from Typesense successfully`);
				} catch (error) {
					this.logger.error(`Failed to delete playlist ${playlistId} from Typesense: ${error.message}`);
				}
				break;
			}
			case 'upsert': {
				const playlistData = await this.db.query.playlist.findFirst({
					where: eq(playlist.id, playlistId),
					with: {
						members: {
							columns: {
								userId: true,
							}
						}
					}
				});

				if (!playlistData) {
					this.logger.warn(`Playlist ${playlistId} not found in database`);
					return;
				}

				const memberIds = playlistData.members.map(member => member.userId);

				const document = {
					id: playlistData.id.toString(),
					title: playlistData.title,
					description: playlistData.description,
					likes_count: playlistData.likesCount,
					items_count: playlistData.itemsCount,
					created_at: new Date(playlistData.createdAt).getTime(),
					updated_at: new Date(playlistData.updatedAt).getTime(),
					visibility: playlistData.visibility,
					owner_id: playlistData.userId,
					member_ids: memberIds,
				};

				try {
					await this.typesense.collections('playlists').documents().upsert(document);
				} catch (error) {
					this.logger.error(`Failed to sync playlist ${playlistId} to Typesense: ${error.message}`);
				}
				break;
			}
		}
		this.logger.log(`Playlist ${playlistId} synced to Typesense successfully`);

        // const playlistData = await this.db.query.playlist.findFirst({
        //     where: (eq(playlist.id, playlistId)), 
        //     with: {
        //         members: {
        //             columns: {
        //                 userId: true,
        //             }
        //         }
        //     }
        // });

        // if (!playlistData) {
        //     this.logger.warn(`Playlist ${playlistId} not found in database`);
        //     return;
        // }

        // const memberIds = playlistData.members.map(member => member.userId);

        // const document = {
        //     id: playlistData.id.toString(),
        //     title: playlistData.title,
		// 	description: playlistData.description,
        //     likes_count: playlistData.likesCount,
        //     items_count: playlistData.itemsCount,
        //     created_at: new Date(playlistData.createdAt).getTime(),
        //     updated_at: new Date(playlistData.updatedAt).getTime(),
        //     visibility: playlistData.visibility,
        //     owner_id: playlistData.userId,
        //     member_ids: memberIds,
        // };

        // try {
        //     await this.typesense.collections('playlists').documents().upsert(document);
            
        // } catch (error) {
        //     this.logger.error(`Failed to sync playlist ${playlistId} to Typesense: ${error.message}`);
        //     throw error;
        // }
	}
}