import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { playlistSaved, playlist } from '@libs/db/schemas'; 
import { and, eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { PlaylistSavedDto } from './dto/playlist-saved.dto';

@Injectable()
export class PlaylistSavesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  async get({ user, playlistId }: { user: User; playlistId: number }): Promise<boolean> {
    const save = await this.db.query.playlistSaved.findFirst({
      where: and(
        eq(playlistSaved.playlistId, playlistId),
        eq(playlistSaved.userId, user.id)
      )
    });
    
    return !!save;
  }

  async set({ user, playlistId }: { user: User; playlistId: number }): Promise<PlaylistSavedDto> {
    const existingPlaylist = await this.db.query.playlist.findFirst({
      where: eq(playlist.id, playlistId),
      columns: {
        userId: true,
      },
    });

    if (!existingPlaylist) {
      throw new NotFoundException();
    }

    if (existingPlaylist.userId === user.id) {
      throw new BadRequestException('You cannot save your own playlist.');
    }

    const [save] = await this.db
      .insert(playlistSaved)
      .values({
        playlistId,
        userId: user.id,
      })
      .onConflictDoNothing()
      .returning();
    
    if (!save) {
      const existingSave = await this.db.query.playlistSaved.findFirst({
        where: and(
          eq(playlistSaved.playlistId, playlistId),
          eq(playlistSaved.userId, user.id)
        )
      });
      if (!existingSave) {
        throw new NotFoundException();
      }
      return plainToInstance(PlaylistSavedDto, existingSave, { excludeExtraneousValues: true });
    }

    return plainToInstance(PlaylistSavedDto, save, { excludeExtraneousValues: true });
  }

  async delete({ user, playlistId }: { user: User; playlistId: number }): Promise<PlaylistSavedDto | null> {
    const [deleted] = await this.db
      .delete(playlistSaved)
      .where(and(
        eq(playlistSaved.playlistId, playlistId),
        eq(playlistSaved.userId, user.id)
      ))
      .returning();
    
    if (!deleted) {
      return null;
    }

    return plainToInstance(PlaylistSavedDto, deleted, { excludeExtraneousValues: true });
  }
}