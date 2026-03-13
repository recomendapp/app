import { CanActivate, ExecutionContext, Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { playlist, playlistMember, profile } from '@libs/db/schemas';
import { and, eq, sql } from 'drizzle-orm';
import { AuthenticatedRequest, AuthenticatedSocket } from '../../auth/types/fastify'; // 🔥 Import de tes types de base unifiés
import { PLAYLIST_ROLES_KEY } from '../decorators/playlist-roles.decorator';
import { PlaylistRole } from '../types/playlist-role.type';
import { User } from '../../auth/auth.service';

export interface PlaylistAuthenticatedRequest extends AuthenticatedRequest {
  playlistRole?: PlaylistRole;
}

export interface PlaylistAuthenticatedSocket extends AuthenticatedSocket {
  playlistRole?: PlaylistRole;
}

@Injectable()
export class PlaylistRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<PlaylistRole[]>(PLAYLIST_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isWs = context.getType() === 'ws';
    let user: User | null = null;
    let playlistIdStr: string | number | undefined;
    
    let requestOrClient: (PlaylistAuthenticatedRequest & { params: { playlist_id: string } }) | PlaylistAuthenticatedSocket;

    if (isWs) {
      const wsContext = context.switchToWs();
      requestOrClient = wsContext.getClient<PlaylistAuthenticatedSocket>();
      const data = wsContext.getData<{ playlistId?: string | number }>();
      
      user = requestOrClient.user;
      playlistIdStr = data?.playlistId;
    } else {
      requestOrClient = context.switchToHttp().getRequest<PlaylistAuthenticatedRequest & { params: { playlist_id: string } }>();
      
      user = requestOrClient.user;
      playlistIdStr = requestOrClient.params.playlist_id;
    }

    const playlistId = parseInt(String(playlistIdStr), 10);
    if (!user || isNaN(playlistId)) return false;

    const [access] = await this.db
      .select({
        isOwner: sql<boolean>`${playlist.userId} = ${user.id}`,
        role: playlistMember.role,
        isOwnerPremium: profile.isPremium,
      })
      .from(playlist)
      .innerJoin(profile, eq(profile.id, playlist.userId))
      .leftJoin(playlistMember, and(
        eq(playlistMember.playlistId, playlist.id),
        eq(playlistMember.userId, user.id)
      ))
      .where(eq(playlist.id, playlistId))
      .limit(1);

    if (!access) {
      if (isWs) throw new WsException('Playlist not found');
      throw new NotFoundException('Playlist not found');
    }

    let currentRole: PlaylistRole | null = null;
    if (access.isOwner) {
      currentRole = 'owner';
    } else if (access.role) {
      currentRole = access.isOwnerPremium ? access.role : 'viewer';
    }

    requestOrClient.playlistRole = currentRole;

    if (requiredRoles === undefined) {
      return true;
    }

    if (requiredRoles.length === 0) {
      if (!currentRole) {
        const msg = 'You must be a member of this playlist to perform this action.';
        if (isWs) throw new WsException(msg);
        throw new ForbiddenException(msg);
      }
      return true;
    }

    if (!currentRole || !requiredRoles.includes(currentRole)) {
      const msg = `Access denied. Required roles: ${requiredRoles.join(', ')}`;
      if (isWs) throw new WsException(msg);
      throw new ForbiddenException(msg);
    }

    return true;
  }
}