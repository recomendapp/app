import { io, Socket } from 'socket.io-client';
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

export interface RealtimeConfig {
  baseUrl?: string;
  getAuthCookie?: () => Promise<string | null> | string | null;
}

class RealtimeManager {
  private _playlists: PlaylistSocket | null = null;
  private playlistSubscribers = new Map<number, number>();
  private initializationPromise: Promise<PlaylistSocket> | null = null;

  private config: RealtimeConfig = {
    baseUrl: 'https://api.recomend.app',
    getAuthCookie: () => null,
  };

  public setConfig(newConfig: Partial<RealtimeConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  private async getSocket(): Promise<PlaylistSocket> {
    if (this._playlists) return this._playlists;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      let origin = this.config.baseUrl || 'https://api.recomend.app/v1';
      try {
        origin = new URL(origin).origin;
      } catch {
        console.warn('[Realtime] Invalid base URL for realtime manager', this.config.baseUrl);
      }

      const cookie = this.config.getAuthCookie ? await this.config.getAuthCookie() : null;

      this._playlists = io(`${origin}${PLAYLISTS_NAMESPACE}`, {
        autoConnect: false,
        withCredentials: true,
        transports: ['websocket'],
        extraHeaders: cookie ? { Cookie: cookie } : {},
      });

      this._playlists.on('connect', () => {
        for (const playlistId of this.playlistSubscribers.keys()) {
          this._playlists?.emit(PlaylistClientEvents.SUBSCRIBE, { playlistId }, (res) => {
            if (res?.error) {
              console.error(`[Realtime] Re-subscription error for playlist ${playlistId}:`, res.error);
            }
          });
        }
      });

      this._playlists.connect();
      return this._playlists;
    })();

    return this.initializationPromise;
  }

  subscribe(target: SubscribeTarget, callbacks: PlaylistCallbacks): () => void {
    const playlistId = target.playlist;
    let isUnsubscribed = false;
    let socketInstance: PlaylistSocket | null = null;

    const currentCount = this.playlistSubscribers.get(playlistId) || 0;
    this.playlistSubscribers.set(playlistId, currentCount + 1);

    this.getSocket().then((socket) => {
      if (isUnsubscribed) return;
      
      socketInstance = socket;

      if (this.playlistSubscribers.get(playlistId) === 1) {
        socket.emit(PlaylistClientEvents.SUBSCRIBE, { playlistId }, (res) => {
          if (res?.error) {
            console.error(`[Realtime] Subscription error for playlist ${playlistId}:`, res.error);
          }
        });
      }

      if (callbacks.onItemAdded) socket.on(PlaylistServerEvents.ITEM_ADDED, callbacks.onItemAdded);
      if (callbacks.onItemUpdated) socket.on(PlaylistServerEvents.ITEM_UPDATED, callbacks.onItemUpdated);
      if (callbacks.onItemDeleted) socket.on(PlaylistServerEvents.ITEM_DELETED, callbacks.onItemDeleted);
    });

    return () => {
      isUnsubscribed = true;
      const newCount = (this.playlistSubscribers.get(playlistId) || 1) - 1;
      
      if (newCount === 0) {
        this.playlistSubscribers.delete(playlistId);
        if (socketInstance) {
          socketInstance.emit(PlaylistClientEvents.UNSUBSCRIBE, { playlistId });
        }
      } else {
        this.playlistSubscribers.set(playlistId, newCount);
      }

      if (socketInstance) {
        if (callbacks.onItemAdded) socketInstance.off(PlaylistServerEvents.ITEM_ADDED, callbacks.onItemAdded);
        if (callbacks.onItemUpdated) socketInstance.off(PlaylistServerEvents.ITEM_UPDATED, callbacks.onItemUpdated);
        if (callbacks.onItemDeleted) socketInstance.off(PlaylistServerEvents.ITEM_DELETED, callbacks.onItemDeleted);
      }
    };
  }

  disconnectAll() {
    if (this._playlists) {
      this._playlists.disconnect();
      this._playlists = null;
      this.initializationPromise = null;
    }
    this.playlistSubscribers.clear();
  }
}

export const realtime = new RealtimeManager();