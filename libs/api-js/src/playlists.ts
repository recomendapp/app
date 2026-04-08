import { Playlist, PlaylistItemWithMovie, PlaylistItemWithTvSeries } from "./__generated__";

export type PlaylistItemWithMedia = (
	| ({ type: 'movie' } & PlaylistItemWithMovie)
	| ({ type: 'tv_series' } & PlaylistItemWithTvSeries)
);

export const ROLES_CAN_EDIT: Playlist['role'][] = ['editor', 'admin', 'owner'] as const;
export const ROLES_CAN_EDIT_PLAYLIST: Playlist['role'][] = ['admin', 'owner'] as const;

export const canEditPlaylistItem = (role: Playlist['role']) => ROLES_CAN_EDIT.includes(role);
export const canEditPlaylist = (role: Playlist['role']) => ROLES_CAN_EDIT_PLAYLIST.includes(role);