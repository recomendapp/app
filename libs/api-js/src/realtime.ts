import { io, Socket } from 'socket.io-client';
import {
  REALTIME_NAMESPACE,
  PlaylistServerEvents,
  IPlaylistItemUpdatedSignal,
  IPlaylistItemsDeletedSignal,
} from '@libs/realtime';
import { PlaylistItemWithMedia } from './playlists';

export interface PlaylistServerToClientEvents {
  [PlaylistServerEvents.ITEM_ADDED]: (items: PlaylistItemWithMedia[]) => void;
  [PlaylistServerEvents.ITEM_UPDATED]: (item: IPlaylistItemUpdatedSignal) => void;
  [PlaylistServerEvents.ITEM_DELETED]: (signal: IPlaylistItemsDeletedSignal) => void;
}

export type RealtimeSocket = Socket<PlaylistServerToClientEvents>;

export interface PlaylistCallbacks {
  onItemAdded?: (items: PlaylistItemWithMedia[]) => void;
  onItemUpdated?: (item: IPlaylistItemUpdatedSignal) => void;
  onItemDeleted?: (signal: IPlaylistItemsDeletedSignal) => void;
}

export interface RealtimeConfig {
  baseUrl?: string;
  getAuthCookie?: () => Promise<string | null> | string | null;
}

class RealtimeManager {
  private socket: RealtimeSocket | null = null;
  private connectPromise: Promise<RealtimeSocket> | null = null;

  private config: RealtimeConfig = {
    baseUrl: 'https://api.recomend.app',
    getAuthCookie: () => null,
  };

  public setConfig(newConfig: Partial<RealtimeConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  private async createSocket(): Promise<RealtimeSocket> {
    if (this.socket) return this.socket;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = (async () => {
      let origin = this.config.baseUrl || 'https://api.recomend.app';
      try {
        origin = new URL(origin).origin;
      } catch {
        console.warn('[Realtime] Invalid base URL for realtime manager', this.config.baseUrl);
      }

      const cookie = this.config.getAuthCookie ? await this.config.getAuthCookie() : null;

      const socket: RealtimeSocket = io(`${origin}${REALTIME_NAMESPACE}`, {
        autoConnect: false,
        withCredentials: true,
        transports: ['websocket'],
        extraHeaders: cookie ? { Cookie: cookie } : {},
      });

      socket.connect();
      this.socket = socket;
      return socket;
    })();

    return this.connectPromise;
  }

  /** Opens the persistent connection. Idempotent — safe to call from multiple mount points. */
  public connect(): Promise<RealtimeSocket> {
    return this.createSocket();
  }

  /** Tears down the connection — call on logout. */
  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connectPromise = null;
  }

  /**
   * Registers playlist event callbacks on the shared connection, connecting it first if needed.
   * Returns an unsubscribe function. Meant to be called once app-wide (see `useRealtimeSync` in
   * `@libs/query-client`), not per playlist screen — events for every playlist the user belongs
   * to arrive here regardless of which one is being viewed.
   */
  public onPlaylistEvents(callbacks: PlaylistCallbacks): () => void {
    let isUnsubscribed = false;
    let socketInstance: RealtimeSocket | null = null;

    this.createSocket().then((socket) => {
      if (isUnsubscribed) return;
      socketInstance = socket;

      if (callbacks.onItemAdded) socket.on(PlaylistServerEvents.ITEM_ADDED, callbacks.onItemAdded);
      if (callbacks.onItemUpdated) {
        socket.on(PlaylistServerEvents.ITEM_UPDATED, callbacks.onItemUpdated);
      }
      if (callbacks.onItemDeleted) {
        socket.on(PlaylistServerEvents.ITEM_DELETED, callbacks.onItemDeleted);
      }
    });

    return () => {
      isUnsubscribed = true;
      if (!socketInstance) return;

      if (callbacks.onItemAdded)
        socketInstance.off(PlaylistServerEvents.ITEM_ADDED, callbacks.onItemAdded);
      if (callbacks.onItemUpdated) {
        socketInstance.off(PlaylistServerEvents.ITEM_UPDATED, callbacks.onItemUpdated);
      }
      if (callbacks.onItemDeleted) {
        socketInstance.off(PlaylistServerEvents.ITEM_DELETED, callbacks.onItemDeleted);
      }
    };
  }
}

export const realtime = new RealtimeManager();
