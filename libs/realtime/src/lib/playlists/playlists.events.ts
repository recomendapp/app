import { PlaylistClientEvents, PlaylistServerEvents } from './playlists.registry';

export type PlaylistItemType = 'movie' | 'tv_series';

export interface IPlaylistItemSignal {
  id: number;
  playlistId: number;
  mediaId: number;
  type: PlaylistItemType;
  rank: string;
  comment: string | null;
}

export interface PlaylistClientToServerEvents {
  [PlaylistClientEvents.SUBSCRIBE]: (
    payload: { playlistId: number; token?: string },
    callback: (response: { event: string; data?: { playlistId: number }; error?: string }) => void
  ) => void;
  
  [PlaylistClientEvents.UNSUBSCRIBE]: (
    payload: { playlistId: number }
  ) => void;
}

export interface PlaylistServerToClientEvents {
  [PlaylistServerEvents.ITEM_ADDED]: (items: IPlaylistItemSignal[]) => void;
  [PlaylistServerEvents.ITEM_UPDATED]: (item: Pick<IPlaylistItemSignal, 'id' | 'rank' | 'comment'>) => void;
  [PlaylistServerEvents.ITEM_DELETED]: (itemIds: number[]) => void;
}