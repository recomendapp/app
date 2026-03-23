import { ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { User } from '../auth/auth.service';
import { PlaylistCreateDto, PlaylistDto, PlaylistUpdateDto, PlaylistWithOwnerDto } from './dto/playlists.dto';
import { playlist } from '@libs/db/schemas';
import { and, eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { StorageService } from '../../common/modules/storage/storage.service';
import { StorageFolders } from '../../common/modules/storage/storage.constants';
import { canViewPlaylist } from './playlists.permission';
import { PlaylistRole } from './types/playlist-role.type';
import { PlaylistQueryBuilder } from './playlists.query-builder';
import { WorkerClient } from '@shared/worker';

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly storageService: StorageService,
    private readonly workerClient: WorkerClient,
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
      where: and(
        eq(playlist.id, playlistId),
        accessCondition
      ),
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
            profile: { columns: { isPremium: true } }
          } 
        }
      }
    });

    if (!result) {
      throw new NotFoundException('Playlist not found');
    }

    const { user, role, ...playlistData } = result;

    return plainToInstance(PlaylistWithOwnerDto, {
      ...playlistData,
      role: role,
      owner: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.image,
        isPremium: user.profile.isPremium,
      }
    }, { excludeExtraneousValues: true });
  }

  async create(currentUser: User, createPlaylistDto: PlaylistCreateDto): Promise<PlaylistDto> {
    const [insertedPlaylist] = await this.db.insert(playlist).values({
      userId: currentUser.id,
      ...createPlaylistDto,
    }).returning();

    if (!insertedPlaylist) {
      throw new NotFoundException('Failed to create playlist');
    }

    this.workerClient.emit('search:sync-playlist', {
      playlistId: insertedPlaylist.id,
      action: 'upsert'
    }).catch(err => this.logger.error(`Failed to emit search sync for playlist ${insertedPlaylist.id}`, err));
  
    return plainToInstance(PlaylistDto, insertedPlaylist);
  }

  async update({
    role,
    playlistId,
    updatePlaylistDto,
  }: {
    role: PlaylistRole;
    playlistId: number;
    updatePlaylistDto: PlaylistUpdateDto;
  }): Promise<PlaylistDto> {
    if (role != 'owner' && updatePlaylistDto.visibility !== undefined) {
      throw new ForbiddenException('Only the owner can change the playlist visibility.');
    }
    const [updatedPlaylist] = await this.db.update(playlist)
      .set(updatePlaylistDto)
      .where(eq(playlist.id, playlistId))
      .returning();
  
    if (!updatedPlaylist) {
      throw new NotFoundException('Playlist not found');
    }

    this.workerClient.emit('search:sync-playlist', {
      playlistId: updatedPlaylist.id,
      action: 'upsert'
    }).catch(err => this.logger.error(`Failed to emit search sync for playlist ${updatedPlaylist.id}`, err));

    return plainToInstance(PlaylistDto, updatedPlaylist);
  }

  async delete({
    playlistId,
  }: {
    playlistId: number;
  }): Promise<PlaylistDto> {
    const [deletedPlaylist] = await this.db.delete(playlist)
      .where(eq(playlist.id, playlistId))
      .returning();

    if (!deletedPlaylist) {
      throw new NotFoundException('Playlist not found');
    }

    if (deletedPlaylist.poster) {
      this.storageService.deleteFile(deletedPlaylist.poster, StorageFolders.PLAYLIST_POSTERS).catch(err => 
        this.logger.error(`Failed to delete poster: ${deletedPlaylist.poster}`, err)
      );
    }

    this.workerClient.emit('search:sync-playlist', {
      playlistId: deletedPlaylist.id,
      action: 'delete'
    }).catch(err => this.logger.error(`Failed to emit search sync for playlist ${deletedPlaylist.id}`, err));

    return plainToInstance(PlaylistDto, deletedPlaylist);
  }
}
