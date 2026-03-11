import { CanActivate, ExecutionContext, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { playlist } from '@libs/db/schemas';
import { and, eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../../auth/types/fastify';
import { PlaylistQueryBuilder } from '../playlists.query-builder';

@Injectable()
export class PlaylistVisibilityGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest & { params: { playlist_id: string } }>();
    const user = request.user || null;
    const playlistId = parseInt(request.params.playlist_id, 10);

    if (isNaN(playlistId)) return false;

    const visibilityCondition = PlaylistQueryBuilder.getVisibilityCondition(this.db, user);

    const playlistRecord = await this.db.query.playlist.findFirst({
      where: and(
        eq(playlist.id, playlistId),
        visibilityCondition
      ),
      columns: { id: true }
    });

    if (!playlistRecord) {
      throw new NotFoundException('Playlist not found');
    }

    return true;
  }
}