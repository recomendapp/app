import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { StorageService } from '../../../common/modules/storage/storage.service';
import { StorageFolders } from '../../../common/modules/storage/storage.constants';
import { MultipartFile } from '@fastify/multipart';
import { eq } from 'drizzle-orm';
import { playlist } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import { PlaylistDto } from '../dto/playlists.dto';

@Injectable()
export class PLaylistPosterService {
  private readonly logger = new Logger(PLaylistPosterService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly storageService: StorageService,
  ) {}

  async set({
    playlistId,
    file,
    currentUser,
  }: {
    playlistId: number,
    file: MultipartFile,
    currentUser: User,
  }): Promise<PlaylistDto> {

    const existingPlaylist = await this.db.query.playlist.findFirst({
      where: eq(playlist.id, playlistId),
      columns: { userId: true, poster: true },
    });

    if (!existingPlaylist) {
      throw new NotFoundException('Playlist not found');
    }
    if (existingPlaylist.userId !== currentUser.id) {
      throw new BadRequestException('You do not have permission to change the poster of this playlist');
    }

    const { filename: newAvatarFilename } = await this.storageService.uploadFile(
      file, 
      StorageFolders.PLAYLIST_POSTERS
    );

    const [updatedPlaylist] = await this.db.update(playlist)
      .set({ poster: newAvatarFilename })
      .where(eq(playlist.id, playlistId))
      .returning();

    if (existingPlaylist.poster) {
      this.storageService.deleteFile(existingPlaylist.poster, StorageFolders.PLAYLIST_POSTERS).catch(err => 
        this.logger.error(`Failed to delete old poster: ${existingPlaylist.poster}`, err)
      );
    }

    return plainToInstance(PlaylistDto, updatedPlaylist);
  }

  async delete({
    playlistId,
    currentUser,
  }: {
    playlistId: number,
    currentUser: User,
  }): Promise<PlaylistDto> {
    const existingPlaylist = await this.db.query.playlist.findFirst({
      where: eq(playlist.id, playlistId),
      columns: { userId: true, poster: true },
    });

    if (!existingPlaylist) {
      throw new NotFoundException('Playlist not found');
    }
    if (existingPlaylist.userId !== currentUser.id) {
      throw new BadRequestException('You do not have permission to change the poster of this playlist');
    }
    if (!existingPlaylist.poster) {
      throw new BadRequestException('This playlist does not have a poster to delete');
    }

    const [deletedPlaylist] = await this.db.update(playlist)
      .set({ poster: null })
      .where(eq(playlist.id, playlistId))
      .returning();

    await this.storageService.deleteFile(existingPlaylist.poster, StorageFolders.PLAYLIST_POSTERS);

    return plainToInstance(PlaylistDto, deletedPlaylist);
  }
}