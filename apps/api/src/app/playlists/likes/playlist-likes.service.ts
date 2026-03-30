import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { playlistLike } from '@libs/db/schemas';
import { and, eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { PlaylistLikeDto } from './dto/playlist-likes.dto';
import { WorkerClient } from '@shared/worker';

@Injectable()
export class PlaylistLikesService {
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
    const like = await this.db.query.playlistLike
      .findFirst({
        where: and(
          eq(playlistLike.playlistId, playlistId),
          eq(playlistLike.userId, user.id)
        )
      });
    return !!like;
  }

  async set({
    user,
    playlistId,
  }: {
    user: User;
    playlistId: number;
  }): Promise<PlaylistLikeDto> {
    const [like] = await this.db
      .insert(playlistLike)
      .values({
        playlistId,
        userId: user.id,
      })
      .onConflictDoNothing()
      .returning();
    
    if (!like) {
      const existingLike = await this.db.query.playlistLike
        .findFirst({
          where: and(
            eq(playlistLike.playlistId, playlistId),
            eq(playlistLike.userId, user.id)
          )
        });
      if (!existingLike) {
        throw new NotFoundException('Playlist not found');
      }
      return plainToInstance(PlaylistLikeDto, existingLike, { excludeExtraneousValues: true });
    }

    await Promise.all([
      this.workerClient.emit('counters:update-playlist-likes', {
        playlistId,
        action: 'increment',
      }),
    ]);

    return plainToInstance(PlaylistLikeDto, like, { excludeExtraneousValues: true });
  }

  async delete({
    user,
    playlistId,
  }: {
    user: User;
    playlistId: number;
  }): Promise<PlaylistLikeDto | null> {
    const [deleted] = await this.db
      .delete(playlistLike)
      .where(and(
        eq(playlistLike.playlistId, playlistId),
        eq(playlistLike.userId, user.id)
      ))
      .returning();
    
    if (!deleted) {
      return null;
    }

    await Promise.all([
      this.workerClient.emit('counters:update-playlist-likes', {
        playlistId,
        action: 'decrement',
      }),
    ]);

    return plainToInstance(PlaylistLikeDto, deleted, { excludeExtraneousValues: true });
  }
}
