import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { playlistSaved } from '@libs/db/schemas';
import { and, eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { WorkerClient } from '@shared/worker';
import { PlaylistSavedDto } from './dto/playlist-saved.dto';

@Injectable()
export class PlaylistSavesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly workerClient: WorkerClient,
  ) {}

  async get({
    user,
    playlistId,
  }: {
    user: User;
    playlistId: number;
  }): Promise<boolean> {
    const save = await this.db.query.playlistSaved
      .findFirst({
        where: and(
          eq(playlistSaved.playlistId, playlistId),
          eq(playlistSaved.userId, user.id)
        )
      });
    
    return !!save;
  }

  async set({
    user,
    playlistId,
  }: {
    user: User;
    playlistId: number;
  }): Promise<PlaylistSavedDto> {
    const [save] = await this.db
      .insert(playlistSaved)
      .values({
        playlistId,
        userId: user.id,
      })
      .onConflictDoNothing()
      .returning();
    
    if (!save) {
      const existingSave = await this.db.query.playlistSaved
        .findFirst({
          where: and(
            eq(playlistSaved.playlistId, playlistId),
            eq(playlistSaved.userId, user.id)
          )
        });
      if (!existingSave) {
        throw new NotFoundException('Playlist not found');
      }
      return plainToInstance(PlaylistSavedDto, existingSave, { excludeExtraneousValues: true });
    }

    await this.workerClient.emit('counters:update-playlist-saves', {
      playlistId,
      action: 'increment',
    });

    return plainToInstance(PlaylistSavedDto, save, { excludeExtraneousValues: true });
  }

  async delete({
    user,
    playlistId,
  }: {
    user: User;
    playlistId: number;
  }): Promise<PlaylistSavedDto | null> {
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

    await this.workerClient.emit('counters:update-playlist-saves', {
      playlistId,
      action: 'decrement',
    });

    return plainToInstance(PlaylistSavedDto, deleted, { excludeExtraneousValues: true });
  }
}
