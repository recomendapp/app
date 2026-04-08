import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { playlistLike } from '@libs/db/schemas';
import { and, eq } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { PlaylistLikeDto } from './dto/playlist-likes.dto';

@Injectable()
export class PlaylistLikesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
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

    return plainToInstance(PlaylistLikeDto, deleted, { excludeExtraneousValues: true });
  }
}
