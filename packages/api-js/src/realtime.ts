import { io, Socket } from 'socket.io-client';
import { client } from './__generated__/client.gen';
import { 
  PLAYLISTS_NAMESPACE, 
  PlaylistClientEvents,
  PlaylistServerEvents,
  PlaylistClientToServerEvents, 
  PlaylistServerToClientEvents,
  IPlaylistItemSignal
} from '@libs/realtime';

export type PlaylistSocket = Socket<PlaylistServerToClientEvents, PlaylistClientToServerEvents>;

export type SubscribeTarget = 
  | { playlist: number };

export interface PlaylistCallbacks {
  onItemAdded?: (items: IPlaylistItemSignal[]) => void;
  onItemUpdated?: (item: Pick<IPlaylistItemSignal, 'id' | 'rank' | 'comment'>) => void;
  onItemDeleted?: (itemIds: number[]) => void;
}

class RealtimeManager {
  private _playlists: PlaylistSocket | null = null;

  private get playlists(): PlaylistSocket {
    if (!this._playlists) {
      const config = client.getConfig();
      const baseUrl = config.baseUrl || 'https://api.recomend.app';

	  let origin = baseUrl;
      try {
        origin = new URL(baseUrl).origin; 
      } catch (error) {
        console.warn('Invalid base URL for realtime manager', baseUrl);
      }

      this._playlists = io(`${origin}${PLAYLISTS_NAMESPACE}`, {
        autoConnect: false,
        withCredentials: true,
        transports: ['websocket'],
      });
    }
    return this._playlists;
  }

  subscribe(target: SubscribeTarget, callbacks: PlaylistCallbacks): () => void {
    
    if ('playlist' in target) {
      const socket = this.playlists;
      const playlistId = target.playlist;

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit(PlaylistClientEvents.SUBSCRIBE, { playlistId }, (res) => {
        if (res.error) {
          console.error(`[Realtime] Subscription error for playlist ${playlistId}:`, res.error);
        }
      });

      if (callbacks.onItemAdded) socket.on(PlaylistServerEvents.ITEM_ADDED, callbacks.onItemAdded);
      if (callbacks.onItemUpdated) socket.on(PlaylistServerEvents.ITEM_UPDATED, callbacks.onItemUpdated);
      if (callbacks.onItemDeleted) socket.on(PlaylistServerEvents.ITEM_DELETED, callbacks.onItemDeleted);

      return () => {
        socket.emit(PlaylistClientEvents.UNSUBSCRIBE, { playlistId });
        
        if (callbacks.onItemAdded) socket.off(PlaylistServerEvents.ITEM_ADDED, callbacks.onItemAdded);
        if (callbacks.onItemUpdated) socket.off(PlaylistServerEvents.ITEM_UPDATED, callbacks.onItemUpdated);
        if (callbacks.onItemDeleted) socket.off(PlaylistServerEvents.ITEM_DELETED, callbacks.onItemDeleted);
      };
    }

    return () => {};
  }

  disconnectAll() {
    if (this._playlists) {
      this._playlists.disconnect();
      this._playlists = null;
    }
  }
}

export const realtime = new RealtimeManager();