import { io, Socket } from 'socket.io-client';
import {
  REALTIME_NAMESPACE,
  PlaylistServerEvents,
  IPlaylistItemUpdatedSignal,
  IPlaylistItemsDeletedSignal,
  IPlaylistDeletedSignal,
  LogServerEvents,
} from '@libs/realtime';
import {
  LogMovie,
  LogTvSeasonUpdateResponse,
  LogTvEpisodeUpdateResponse,
  LogTvSeries,
  Playlist,
  WatchedDateResponse,
} from './__generated__';
import { PlaylistItemWithMedia } from './playlists';

export interface PlaylistServerToClientEvents {
  [PlaylistServerEvents.CREATED]: (playlist: Playlist) => void;
  [PlaylistServerEvents.UPDATED]: (playlist: Playlist) => void;
  [PlaylistServerEvents.DELETED]: (signal: IPlaylistDeletedSignal) => void;
  [PlaylistServerEvents.ITEM_ADDED]: (items: PlaylistItemWithMedia[]) => void;
  [PlaylistServerEvents.ITEM_UPDATED]: (item: IPlaylistItemUpdatedSignal) => void;
  [PlaylistServerEvents.ITEM_DELETED]: (signal: IPlaylistItemsDeletedSignal) => void;
}

export interface LogServerToClientEvents {
  [LogServerEvents.MOVIE_LOG_SET]: (log: LogMovie) => void;
  [LogServerEvents.MOVIE_LOG_DELETED]: (log: LogMovie) => void;
  [LogServerEvents.TV_SERIES_LOG_SET]: (log: LogTvSeries) => void;
  [LogServerEvents.TV_SERIES_LOG_DELETED]: (log: LogTvSeries) => void;
  [LogServerEvents.TV_SEASON_LOG_SET]: (payload: LogTvSeasonUpdateResponse) => void;
  [LogServerEvents.TV_SEASON_LOG_DELETED]: (payload: LogTvSeasonUpdateResponse) => void;
  [LogServerEvents.TV_EPISODE_LOG_SET]: (payload: LogTvEpisodeUpdateResponse) => void;
  [LogServerEvents.TV_EPISODE_LOG_DELETED]: (payload: LogTvEpisodeUpdateResponse) => void;
  [LogServerEvents.MOVIE_WATCHED_DATE_SET]: (payload: WatchedDateResponse) => void;
  [LogServerEvents.MOVIE_WATCHED_DATE_UPDATED]: (payload: WatchedDateResponse) => void;
  [LogServerEvents.MOVIE_WATCHED_DATE_DELETED]: (payload: WatchedDateResponse) => void;
}

export type RealtimeSocket = Socket<PlaylistServerToClientEvents & LogServerToClientEvents>;

export interface PlaylistCallbacks {
  onPlaylistCreated?: (playlist: Playlist) => void;
  onPlaylistUpdated?: (playlist: Playlist) => void;
  onPlaylistDeleted?: (signal: IPlaylistDeletedSignal) => void;
  onItemAdded?: (items: PlaylistItemWithMedia[]) => void;
  onItemUpdated?: (item: IPlaylistItemUpdatedSignal) => void;
  onItemDeleted?: (signal: IPlaylistItemsDeletedSignal) => void;
}

export interface LogCallbacks {
  onMovieLogSet?: (log: LogMovie) => void;
  onMovieLogDeleted?: (log: LogMovie) => void;
  onTvSeriesLogSet?: (log: LogTvSeries) => void;
  onTvSeriesLogDeleted?: (log: LogTvSeries) => void;
  onTvSeasonLogSet?: (payload: LogTvSeasonUpdateResponse) => void;
  onTvSeasonLogDeleted?: (payload: LogTvSeasonUpdateResponse) => void;
  onTvEpisodeLogSet?: (payload: LogTvEpisodeUpdateResponse) => void;
  onTvEpisodeLogDeleted?: (payload: LogTvEpisodeUpdateResponse) => void;
  onMovieWatchedDateSet?: (payload: WatchedDateResponse) => void;
  onMovieWatchedDateUpdated?: (payload: WatchedDateResponse) => void;
  onMovieWatchedDateDeleted?: (payload: WatchedDateResponse) => void;
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

      if (callbacks.onPlaylistCreated) {
        socket.on(PlaylistServerEvents.CREATED, callbacks.onPlaylistCreated);
      }
      if (callbacks.onPlaylistUpdated) {
        socket.on(PlaylistServerEvents.UPDATED, callbacks.onPlaylistUpdated);
      }
      if (callbacks.onPlaylistDeleted) {
        socket.on(PlaylistServerEvents.DELETED, callbacks.onPlaylistDeleted);
      }
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

      if (callbacks.onPlaylistCreated) {
        socketInstance.off(PlaylistServerEvents.CREATED, callbacks.onPlaylistCreated);
      }
      if (callbacks.onPlaylistUpdated) {
        socketInstance.off(PlaylistServerEvents.UPDATED, callbacks.onPlaylistUpdated);
      }
      if (callbacks.onPlaylistDeleted) {
        socketInstance.off(PlaylistServerEvents.DELETED, callbacks.onPlaylistDeleted);
      }
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

  /**
   * Registers log event callbacks on the shared connection, connecting it first if needed.
   * Returns an unsubscribe function. Meant to be called once app-wide (see `useRealtimeSync` in
   * `@libs/query-client`) — events for every log the user creates, on any device, arrive here.
   */
  public onLogEvents(callbacks: LogCallbacks): () => void {
    let isUnsubscribed = false;
    let socketInstance: RealtimeSocket | null = null;

    this.createSocket().then((socket) => {
      if (isUnsubscribed) return;
      socketInstance = socket;

      if (callbacks.onMovieLogSet) {
        socket.on(LogServerEvents.MOVIE_LOG_SET, callbacks.onMovieLogSet);
      }
      if (callbacks.onMovieLogDeleted) {
        socket.on(LogServerEvents.MOVIE_LOG_DELETED, callbacks.onMovieLogDeleted);
      }
      if (callbacks.onTvSeriesLogSet) {
        socket.on(LogServerEvents.TV_SERIES_LOG_SET, callbacks.onTvSeriesLogSet);
      }
      if (callbacks.onTvSeriesLogDeleted) {
        socket.on(LogServerEvents.TV_SERIES_LOG_DELETED, callbacks.onTvSeriesLogDeleted);
      }
      if (callbacks.onTvSeasonLogSet) {
        socket.on(LogServerEvents.TV_SEASON_LOG_SET, callbacks.onTvSeasonLogSet);
      }
      if (callbacks.onTvSeasonLogDeleted) {
        socket.on(LogServerEvents.TV_SEASON_LOG_DELETED, callbacks.onTvSeasonLogDeleted);
      }
      if (callbacks.onTvEpisodeLogSet) {
        socket.on(LogServerEvents.TV_EPISODE_LOG_SET, callbacks.onTvEpisodeLogSet);
      }
      if (callbacks.onTvEpisodeLogDeleted) {
        socket.on(LogServerEvents.TV_EPISODE_LOG_DELETED, callbacks.onTvEpisodeLogDeleted);
      }
      if (callbacks.onMovieWatchedDateSet) {
        socket.on(LogServerEvents.MOVIE_WATCHED_DATE_SET, callbacks.onMovieWatchedDateSet);
      }
      if (callbacks.onMovieWatchedDateUpdated) {
        socket.on(LogServerEvents.MOVIE_WATCHED_DATE_UPDATED, callbacks.onMovieWatchedDateUpdated);
      }
      if (callbacks.onMovieWatchedDateDeleted) {
        socket.on(LogServerEvents.MOVIE_WATCHED_DATE_DELETED, callbacks.onMovieWatchedDateDeleted);
      }
    });

    return () => {
      isUnsubscribed = true;
      if (!socketInstance) return;

      if (callbacks.onMovieLogSet) {
        socketInstance.off(LogServerEvents.MOVIE_LOG_SET, callbacks.onMovieLogSet);
      }
      if (callbacks.onMovieLogDeleted) {
        socketInstance.off(LogServerEvents.MOVIE_LOG_DELETED, callbacks.onMovieLogDeleted);
      }
      if (callbacks.onTvSeriesLogSet) {
        socketInstance.off(LogServerEvents.TV_SERIES_LOG_SET, callbacks.onTvSeriesLogSet);
      }
      if (callbacks.onTvSeriesLogDeleted) {
        socketInstance.off(LogServerEvents.TV_SERIES_LOG_DELETED, callbacks.onTvSeriesLogDeleted);
      }
      if (callbacks.onTvSeasonLogSet) {
        socketInstance.off(LogServerEvents.TV_SEASON_LOG_SET, callbacks.onTvSeasonLogSet);
      }
      if (callbacks.onTvSeasonLogDeleted) {
        socketInstance.off(LogServerEvents.TV_SEASON_LOG_DELETED, callbacks.onTvSeasonLogDeleted);
      }
      if (callbacks.onTvEpisodeLogSet) {
        socketInstance.off(LogServerEvents.TV_EPISODE_LOG_SET, callbacks.onTvEpisodeLogSet);
      }
      if (callbacks.onTvEpisodeLogDeleted) {
        socketInstance.off(LogServerEvents.TV_EPISODE_LOG_DELETED, callbacks.onTvEpisodeLogDeleted);
      }
      if (callbacks.onMovieWatchedDateSet) {
        socketInstance.off(LogServerEvents.MOVIE_WATCHED_DATE_SET, callbacks.onMovieWatchedDateSet);
      }
      if (callbacks.onMovieWatchedDateUpdated) {
        socketInstance.off(
          LogServerEvents.MOVIE_WATCHED_DATE_UPDATED,
          callbacks.onMovieWatchedDateUpdated,
        );
      }
      if (callbacks.onMovieWatchedDateDeleted) {
        socketInstance.off(
          LogServerEvents.MOVIE_WATCHED_DATE_DELETED,
          callbacks.onMovieWatchedDateDeleted,
        );
      }
    };
  }
}

export const realtime = new RealtimeManager();
