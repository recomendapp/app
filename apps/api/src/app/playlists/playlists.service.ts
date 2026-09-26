import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { User } from '../auth/auth.service';
import {
  PlaylistCreateDto,
  PlaylistDto,
  PlaylistUpdateDto,
  PlaylistWithOwnerDto,
} from './dto/playlists.dto';
import { playlist, playlistItem } from '@libs/db/schemas';
import { and, eq, sql } from 'drizzle-orm';
import { parseResponseDto } from '../../utils/parse-response-dto';
import { StorageService } from '../../common/modules/storage/storage.service';
import { StorageFolders } from '../../common/modules/storage/storage.constants';
import { assertPlaylistRole, assertPlaylistVisible, canViewPlaylist } from './playlists.permission';
import { assertPremium } from '../../utils/assert-premium';
import { PlaylistQueryBuilder } from './playlists.query-builder';
import { WorkerClient } from '@shared/worker';
import { PlaylistsRealtimeService } from './playlists-realtime.service';

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly storageService: StorageService,
    private readonly workerClient: WorkerClient,
    private readonly playlistsRealtimeService: PlaylistsRealtimeService,
  ) {}

  async get({
    playlistId,
    user: currentUser,
  }: {
    playlistId: number;
    user: User | null;
  }): Promise<PlaylistWithOwnerDto> {
    const accessCondition = canViewPlaylist(this.db, currentUser);

    const result = await this.db.query.playlist.findFirst({
      where: and(eq(playlist.id, playlistId), accessCondition),
      extras: {
        role: PlaylistQueryBuilder.getRoleSelection(currentUser).as('role'),
      },
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
          with: {
            profile: { columns: { isPremium: true } },
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('Playlist not found');
    }

    const { user, role, ...playlistData } = result;

    return parseResponseDto(
      PlaylistWithOwnerDto,
      {
        ...playlistData,
        role: role,
        owner: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.image,
          isPremium: user.profile.isPremium,
        },
      },
      { excludeExtraneousValues: true },
    );
  }

  async create(currentUser: User, createPlaylistDto: PlaylistCreateDto): Promise<PlaylistDto> {
    const [insertedPlaylist] = await this.db
      .insert(playlist)
      .values({
        userId: currentUser.id,
        ...createPlaylistDto,
      })
      .returning();

    if (!insertedPlaylist) {
      throw new NotFoundException('Failed to create playlist');
    }

    this.workerClient
      .emit('search:sync-playlist', {
        playlistId: insertedPlaylist.id,
        action: 'upsert',
      })
      .catch((err) =>
        this.logger.error(`Failed to emit search sync for playlist ${insertedPlaylist.id}`, err),
      );

    const playlistDto = parseResponseDto(PlaylistDto, insertedPlaylist);

    this.playlistsRealtimeService.broadcastPlaylistCreated(playlistDto);

    return playlistDto;
  }

  async update({
    user,
    playlistId,
    updatePlaylistDto,
  }: {
    user: User;
    playlistId: number;
    updatePlaylistDto: PlaylistUpdateDto;
  }): Promise<PlaylistDto> {
    const role = await assertPlaylistRole(this.db, user, playlistId, ['owner', 'admin']);
    if (role != 'owner' && updatePlaylistDto.visibility !== undefined) {
      throw new ForbiddenException('Only the owner can change the playlist visibility.');
    }
    const [updatedPlaylist] = await this.db
      .update(playlist)
      .set(updatePlaylistDto)
      .where(eq(playlist.id, playlistId))
      .returning();

    if (!updatedPlaylist) {
      throw new NotFoundException('Playlist not found');
    }

    this.workerClient
      .emit('search:sync-playlist', {
        playlistId: updatedPlaylist.id,
        action: 'upsert',
      })
      .catch((err) =>
        this.logger.error(`Failed to emit search sync for playlist ${updatedPlaylist.id}`, err),
      );

    const playlistDto = parseResponseDto(PlaylistDto, updatedPlaylist);

    this.playlistsRealtimeService
      .broadcastPlaylistUpdated(playlistDto)
      .catch((err) =>
        this.logger.error(
          `Failed to broadcast playlist updated for playlist ${playlistDto.id}`,
          err,
        ),
      );

    return playlistDto;
  }

  async duplicate({ user, playlistId }: { user: User; playlistId: number }): Promise<PlaylistDto> {
    await assertPremium(this.db, user.id);
    await assertPlaylistVisible(this.db, user, playlistId);

    const duplicatedPlaylist = await this.db.transaction(async (tx) => {
      const sourcePlaylist = await tx.query.playlist.findFirst({
        where: eq(playlist.id, playlistId),
      });

      if (!sourcePlaylist) {
        throw new NotFoundException('Playlist not found');
      }

      const [insertedPlaylist] = await tx
        .insert(playlist)
        .values({
          userId: user.id,
          title: sourcePlaylist.title,
          description: sourcePlaylist.description,
          visibility: 'private',
        })
        .returning();

      await tx.execute(sql`
        INSERT INTO ${playlistItem} (
          playlist_id, user_id, type, movie_id, tv_series_id, comment, rank
        )
        SELECT 
          ${insertedPlaylist.id}, 
          ${user.id}, 
          type, 
          movie_id, 
          tv_series_id, 
          comment, 
          rank
        FROM ${playlistItem}
        WHERE ${playlistItem.playlistId} = ${playlistId}
      `);

      // items_count is maintained by a statement-level trigger on playlist_item,
      // so it isn't reflected in insertedPlaylist's RETURNING from before the copy.
      const [refreshedPlaylist] = await tx
        .select()
        .from(playlist)
        .where(eq(playlist.id, insertedPlaylist.id));

      return refreshedPlaylist;
    });

    this.workerClient
      .emit('search:sync-playlist', {
        playlistId: duplicatedPlaylist.id,
        action: 'upsert',
      })
      .catch((err) =>
        this.logger.error(`Failed to emit search sync for playlist ${duplicatedPlaylist.id}`, err),
      );

    const playlistDto = parseResponseDto(PlaylistDto, duplicatedPlaylist);

    this.playlistsRealtimeService.broadcastPlaylistCreated(playlistDto);

    return playlistDto;
  }

  async delete({ user, playlistId }: { user: User; playlistId: number }): Promise<PlaylistDto> {
    await assertPlaylistRole(this.db, user, playlistId, ['owner']);

    const recipientUserIds = await this.playlistsRealtimeService.getRecipientUserIds(playlistId);

    const [deletedPlaylist] = await this.db
      .delete(playlist)
      .where(eq(playlist.id, playlistId))
      .returning();

    if (!deletedPlaylist) {
      throw new NotFoundException('Playlist not found');
    }

    if (deletedPlaylist.poster) {
      this.storageService
        .deleteFile(deletedPlaylist.poster, StorageFolders.PLAYLIST_POSTERS)
        .catch((err) =>
          this.logger.error(`Failed to delete poster: ${deletedPlaylist.poster}`, err),
        );
    }

    this.workerClient
      .emit('search:sync-playlist', {
        playlistId: deletedPlaylist.id,
        action: 'delete',
      })
      .catch((err) =>
        this.logger.error(`Failed to emit search sync for playlist ${deletedPlaylist.id}`, err),
      );

    this.playlistsRealtimeService.broadcastPlaylistDeleted(
      deletedPlaylist.id,
      deletedPlaylist.userId,
      recipientUserIds,
    );

    return parseResponseDto(PlaylistDto, deletedPlaylist);
  }
}
