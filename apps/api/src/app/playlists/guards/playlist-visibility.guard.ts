import { CanActivate, ExecutionContext, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { playlist } from '@libs/db/schemas';
import { and, eq } from 'drizzle-orm';
import { OptionalAuthenticatedRequest, OptionalAuthenticatedSocket } from '../../auth/types/fastify';
import { PlaylistQueryBuilder } from '../playlists.query-builder';
import { User } from '../../auth/auth.service';

@Injectable()
export class PlaylistVisibilityGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isWs = context.getType() === 'ws';
    
    let user: User | null = null;
    let playlistIdStr: string | number | undefined;

    if (isWs) {
      const wsContext = context.switchToWs();
      const client = wsContext.getClient<OptionalAuthenticatedSocket>();
      const data = wsContext.getData<{ playlistId?: string | number }>();
      
      user = client.user || null;
      playlistIdStr = data?.playlistId;
    } else {
      const request = context.switchToHttp().getRequest<OptionalAuthenticatedRequest & { params: { playlist_id: string } }>();
      
      user = request.user || null;
      playlistIdStr = request.params.playlist_id;
    }

    const playlistId = parseInt(String(playlistIdStr), 10);
    
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
      if (isWs) throw new WsException('Playlist not found');
      throw new NotFoundException('Playlist not found');
    }

    return true;
  }
}