import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlaylistAuthenticatedRequest } from '../guards/playlist-roles.guard';
import { PlaylistRole } from '../types/playlist-role.type';

export const CurrentPlaylistRole = createParamDecorator(
  (_, ctx: ExecutionContext): PlaylistRole => {
    const request = ctx.switchToHttp().getRequest<PlaylistAuthenticatedRequest>();
    return request.playlistRole;
  },
);