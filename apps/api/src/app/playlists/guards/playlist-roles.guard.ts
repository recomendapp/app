import { CanActivate, ExecutionContext, Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { playlist, playlistMember, profile } from '@libs/db/schemas'; // 🔥 Ajout de "profile"
import { and, eq, sql } from 'drizzle-orm';
import { AuthenticatedRequest } from '../../auth/types/fastify';
import { PLAYLIST_ROLES_KEY } from '../decorators/playlist-roles.decorator';
import { PlaylistRole } from '../types/playlist-role.type';

export interface PlaylistAuthenticatedRequest extends AuthenticatedRequest {
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

    const request = context.switchToHttp().getRequest<PlaylistAuthenticatedRequest & { params: { playlist_id: string } }>();
    const user = request.user;
    const playlistId = parseInt(request.params.playlist_id, 10);

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

    if (!access) throw new NotFoundException('Playlist not found');

    let currentRole: PlaylistRole | null = null;
    
    if (access.isOwner) {
      currentRole = 'owner';
    } else if (access.role) {
      currentRole = access.isOwnerPremium ? access.role : 'viewer';
    }

    request.playlistRole = currentRole;

    if (requiredRoles === undefined) {
      return true;
    }

    if (requiredRoles.length === 0) {
      if (!currentRole) {
        throw new ForbiddenException('You must be a member of this playlist to perform this action.');
      }
      return true;
    }

    if (!currentRole || !requiredRoles.includes(currentRole)) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}