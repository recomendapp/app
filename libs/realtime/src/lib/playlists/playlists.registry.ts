export const PLAYLISTS_NAMESPACE = '/playlists';

export const PlaylistClientEvents = {
  SUBSCRIBE: 'playlist:subscribe',
  UNSUBSCRIBE: 'playlist:unsubscribe',
} as const;

export const PlaylistServerEvents = {
  ITEM_ADDED: 'playlist:item_added',
  ITEM_UPDATED: 'playlist:item_updated',
  ITEM_DELETED: 'playlist:item_deleted',
} as const;

export const getPlaylistRoomName = (playlistId: number | string) => `playlist:${playlistId}`;

export type PlaylistClientEventName = typeof PlaylistClientEvents[keyof typeof PlaylistClientEvents];
export type PlaylistServerEventName = typeof PlaylistServerEvents[keyof typeof PlaylistServerEvents];