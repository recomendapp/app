import { SetMetadata } from '@nestjs/common';
import { PlaylistRole } from '../types/playlist-role.type';

export const PLAYLIST_ROLES_KEY = 'playlist_roles';

export const RequirePlaylistRoles = (...roles: PlaylistRole[]) => SetMetadata(PLAYLIST_ROLES_KEY, roles);