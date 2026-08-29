import { io, Socket } from 'socket.io-client';
import {
  REALTIME_NAMESPACE,
  PlaylistServerEvents,
  IPlaylistItemUpdatedSignal,
  IPlaylistItemsDeletedSignal,
  IPlaylistDeletedSignal,
  LogServerEvents,
  BookmarkServerEvents,
  RecoServerEvents,
  MeServerEvents,
  UserFollowServerEvents,
  PersonFollowServerEvents,
  ImportServerEvents,
  IImportDeletedSignal,
} from '@libs/realtime';
import {
  Bookmark,
  Follow,
  ImportJob,
  LogMovie,
  LogTvSeasonUpdateResponse,
  LogTvEpisodeUpdateResponse,
  LogTvSeries,
  PersonFollow,
  Playlist,
  PlaylistLike,
  PlaylistSaved,
  Reco,
  RecoSendResponse,
  ReviewMovie,
  ReviewTvSeries,
  User,
  WatchedDateResponse,
} from './__generated__';
import { PlaylistItemWithMedia } from './playlists';
import { BookmarkWithMedia } from './bookmarks';
import { RecoWithMedia } from './recos';

export interface PlaylistServerToClientEvents {
  [PlaylistServerEvents.CREATED]: (playlist: Playlist) => void;
  [PlaylistServerEvents.UPDATED]: (playlist: Playlist) => void;
  [PlaylistServerEvents.DELETED]: (signal: IPlaylistDeletedSignal) => void;
  [PlaylistServerEvents.ITEM_ADDED]: (items: PlaylistItemWithMedia[]) => void;
  [PlaylistServerEvents.ITEM_UPDATED]: (item: IPlaylistItemUpdatedSignal) => void;
  [PlaylistServerEvents.ITEM_DELETED]: (signal: IPlaylistItemsDeletedSignal) => void;
  [PlaylistServerEvents.LIKE_SET]: (like: PlaylistLike) => void;
  [PlaylistServerEvents.LIKE_DELETED]: (like: PlaylistLike) => void;
  [PlaylistServerEvents.SAVE_SET]: (save: PlaylistSaved) => void;
  [PlaylistServerEvents.SAVE_DELETED]: (save: PlaylistSaved) => void;
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
  [LogServerEvents.MOVIE_REVIEW_UPSERTED]: (review: ReviewMovie) => void;
  [LogServerEvents.MOVIE_REVIEW_DELETED]: (review: ReviewMovie) => void;
  [LogServerEvents.TV_SERIES_REVIEW_UPSERTED]: (review: ReviewTvSeries) => void;
  [LogServerEvents.TV_SERIES_REVIEW_DELETED]: (review: ReviewTvSeries) => void;
}

export interface BookmarkServerToClientEvents {
  [BookmarkServerEvents.SET]: (bookmark: BookmarkWithMedia) => void;
  [BookmarkServerEvents.DELETED]: (bookmark: Bookmark) => void;
}

export interface RecoServerToClientEvents {
  [RecoServerEvents.SENT]: (response: RecoSendResponse) => void;
  [RecoServerEvents.RECEIVED]: (reco: RecoWithMedia) => void;
  [RecoServerEvents.DELETED]: (recos: Reco[]) => void;
}

export interface MeServerToClientEvents {
  [MeServerEvents.UPDATED]: (user: User) => void;
}

export interface UserFollowServerToClientEvents {
  [UserFollowServerEvents.SET]: (follow: Follow) => void;
  [UserFollowServerEvents.DELETED]: (follow: Follow) => void;
  [UserFollowServerEvents.ACCEPTED]: (follow: Follow) => void;
  [UserFollowServerEvents.DECLINED]: (follow: Follow) => void;
}

export interface PersonFollowServerToClientEvents {
  [PersonFollowServerEvents.SET]: (follow: PersonFollow) => void;
  [PersonFollowServerEvents.DELETED]: (follow: PersonFollow) => void;
}

export interface ImportServerToClientEvents {
  [ImportServerEvents.CREATED]: (job: ImportJob) => void;
  [ImportServerEvents.PROGRESS]: (job: ImportJob) => void;
  [ImportServerEvents.STAGED]: (job: ImportJob) => void;
  [ImportServerEvents.VALIDATED]: (job: ImportJob) => void;
  [ImportServerEvents.FAILED]: (job: ImportJob) => void;
  [ImportServerEvents.DELETED]: (signal: IImportDeletedSignal) => void;
}

export type RealtimeSocket = Socket<
  PlaylistServerToClientEvents &
    LogServerToClientEvents &
    BookmarkServerToClientEvents &
    RecoServerToClientEvents &
    MeServerToClientEvents &
    UserFollowServerToClientEvents &
    PersonFollowServerToClientEvents &
    ImportServerToClientEvents
>;

export interface PlaylistCallbacks {
  onPlaylistCreated?: (playlist: Playlist) => void;
  onPlaylistUpdated?: (playlist: Playlist) => void;
  onPlaylistDeleted?: (signal: IPlaylistDeletedSignal) => void;
  onItemAdded?: (items: PlaylistItemWithMedia[]) => void;
  onItemUpdated?: (item: IPlaylistItemUpdatedSignal) => void;
  onItemDeleted?: (signal: IPlaylistItemsDeletedSignal) => void;
  onPlaylistLikeSet?: (like: PlaylistLike) => void;
  onPlaylistLikeDeleted?: (like: PlaylistLike) => void;
  onPlaylistSaveSet?: (save: PlaylistSaved) => void;
  onPlaylistSaveDeleted?: (save: PlaylistSaved) => void;
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
  onMovieReviewUpserted?: (review: ReviewMovie) => void;
  onMovieReviewDeleted?: (review: ReviewMovie) => void;
  onTvSeriesReviewUpserted?: (review: ReviewTvSeries) => void;
  onTvSeriesReviewDeleted?: (review: ReviewTvSeries) => void;
}

export interface BookmarkCallbacks {
  onBookmarkSet?: (bookmark: BookmarkWithMedia) => void;
  onBookmarkDeleted?: (bookmark: Bookmark) => void;
}

export interface RecoCallbacks {
  onRecoSent?: (response: RecoSendResponse) => void;
  onRecoReceived?: (reco: RecoWithMedia) => void;
  onRecoDeleted?: (recos: Reco[]) => void;
}

export interface MeCallbacks {
  onMeUpdated?: (user: User) => void;
}

export interface UserFollowCallbacks {
  onUserFollowSet?: (follow: Follow) => void;
  onUserFollowDeleted?: (follow: Follow) => void;
  onUserFollowAccepted?: (follow: Follow) => void;
  onUserFollowDeclined?: (follow: Follow) => void;
}

export interface PersonFollowCallbacks {
  onPersonFollowSet?: (follow: PersonFollow) => void;
  onPersonFollowDeleted?: (follow: PersonFollow) => void;
}

export interface ImportCallbacks {
  onImportCreated?: (job: ImportJob) => void;
  onImportProgress?: (job: ImportJob) => void;
  /** Staging analysis finished — job is now awaiting_review, nothing real written yet. */
  onImportStaged?: (job: ImportJob) => void;
  /** The user validated the import — real rows (logs/bookmarks/playlists) now exist. */
  onImportValidated?: (job: ImportJob) => void;
  onImportFailed?: (job: ImportJob) => void;
  onImportDeleted?: (signal: IImportDeletedSignal) => void;
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
      if (callbacks.onPlaylistLikeSet) {
        socket.on(PlaylistServerEvents.LIKE_SET, callbacks.onPlaylistLikeSet);
      }
      if (callbacks.onPlaylistLikeDeleted) {
        socket.on(PlaylistServerEvents.LIKE_DELETED, callbacks.onPlaylistLikeDeleted);
      }
      if (callbacks.onPlaylistSaveSet) {
        socket.on(PlaylistServerEvents.SAVE_SET, callbacks.onPlaylistSaveSet);
      }
      if (callbacks.onPlaylistSaveDeleted) {
        socket.on(PlaylistServerEvents.SAVE_DELETED, callbacks.onPlaylistSaveDeleted);
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
      if (callbacks.onPlaylistLikeSet) {
        socketInstance.off(PlaylistServerEvents.LIKE_SET, callbacks.onPlaylistLikeSet);
      }
      if (callbacks.onPlaylistLikeDeleted) {
        socketInstance.off(PlaylistServerEvents.LIKE_DELETED, callbacks.onPlaylistLikeDeleted);
      }
      if (callbacks.onPlaylistSaveSet) {
        socketInstance.off(PlaylistServerEvents.SAVE_SET, callbacks.onPlaylistSaveSet);
      }
      if (callbacks.onPlaylistSaveDeleted) {
        socketInstance.off(PlaylistServerEvents.SAVE_DELETED, callbacks.onPlaylistSaveDeleted);
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
      if (callbacks.onMovieReviewUpserted) {
        socket.on(LogServerEvents.MOVIE_REVIEW_UPSERTED, callbacks.onMovieReviewUpserted);
      }
      if (callbacks.onMovieReviewDeleted) {
        socket.on(LogServerEvents.MOVIE_REVIEW_DELETED, callbacks.onMovieReviewDeleted);
      }
      if (callbacks.onTvSeriesReviewUpserted) {
        socket.on(LogServerEvents.TV_SERIES_REVIEW_UPSERTED, callbacks.onTvSeriesReviewUpserted);
      }
      if (callbacks.onTvSeriesReviewDeleted) {
        socket.on(LogServerEvents.TV_SERIES_REVIEW_DELETED, callbacks.onTvSeriesReviewDeleted);
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
      if (callbacks.onMovieReviewUpserted) {
        socketInstance.off(LogServerEvents.MOVIE_REVIEW_UPSERTED, callbacks.onMovieReviewUpserted);
      }
      if (callbacks.onMovieReviewDeleted) {
        socketInstance.off(LogServerEvents.MOVIE_REVIEW_DELETED, callbacks.onMovieReviewDeleted);
      }
      if (callbacks.onTvSeriesReviewUpserted) {
        socketInstance.off(
          LogServerEvents.TV_SERIES_REVIEW_UPSERTED,
          callbacks.onTvSeriesReviewUpserted,
        );
      }
      if (callbacks.onTvSeriesReviewDeleted) {
        socketInstance.off(
          LogServerEvents.TV_SERIES_REVIEW_DELETED,
          callbacks.onTvSeriesReviewDeleted,
        );
      }
    };
  }

  /**
   * Registers bookmark event callbacks on the shared connection, connecting it first if needed.
   * Returns an unsubscribe function. Meant to be called once app-wide (see `useRealtimeSync` in
   * `@libs/query-client`) — events for every bookmark the user creates, on any device, arrive
   * here.
   */
  public onBookmarkEvents(callbacks: BookmarkCallbacks): () => void {
    let isUnsubscribed = false;
    let socketInstance: RealtimeSocket | null = null;

    this.createSocket().then((socket) => {
      if (isUnsubscribed) return;
      socketInstance = socket;

      if (callbacks.onBookmarkSet) {
        socket.on(BookmarkServerEvents.SET, callbacks.onBookmarkSet);
      }
      if (callbacks.onBookmarkDeleted) {
        socket.on(BookmarkServerEvents.DELETED, callbacks.onBookmarkDeleted);
      }
    });

    return () => {
      isUnsubscribed = true;
      if (!socketInstance) return;

      if (callbacks.onBookmarkSet) {
        socketInstance.off(BookmarkServerEvents.SET, callbacks.onBookmarkSet);
      }
      if (callbacks.onBookmarkDeleted) {
        socketInstance.off(BookmarkServerEvents.DELETED, callbacks.onBookmarkDeleted);
      }
    };
  }

  /**
   * Registers reco event callbacks on the shared connection, connecting it first if needed.
   * Returns an unsubscribe function. Meant to be called once app-wide (see `useRealtimeSync` in
   * `@libs/query-client`) — covers both sides: the sender (`onRecoSent`, `onRecoDeleted`) and
   * every receiver (`onRecoReceived`, `onRecoDeleted`).
   */
  public onRecoEvents(callbacks: RecoCallbacks): () => void {
    let isUnsubscribed = false;
    let socketInstance: RealtimeSocket | null = null;

    this.createSocket().then((socket) => {
      if (isUnsubscribed) return;
      socketInstance = socket;

      if (callbacks.onRecoSent) {
        socket.on(RecoServerEvents.SENT, callbacks.onRecoSent);
      }
      if (callbacks.onRecoReceived) {
        socket.on(RecoServerEvents.RECEIVED, callbacks.onRecoReceived);
      }
      if (callbacks.onRecoDeleted) {
        socket.on(RecoServerEvents.DELETED, callbacks.onRecoDeleted);
      }
    });

    return () => {
      isUnsubscribed = true;
      if (!socketInstance) return;

      if (callbacks.onRecoSent) {
        socketInstance.off(RecoServerEvents.SENT, callbacks.onRecoSent);
      }
      if (callbacks.onRecoReceived) {
        socketInstance.off(RecoServerEvents.RECEIVED, callbacks.onRecoReceived);
      }
      if (callbacks.onRecoDeleted) {
        socketInstance.off(RecoServerEvents.DELETED, callbacks.onRecoDeleted);
      }
    };
  }

  /**
   * Registers "me" (own profile) event callbacks on the shared connection, connecting it first
   * if needed. Returns an unsubscribe function. Meant to be called once app-wide (see
   * `useRealtimeSync` in `@libs/query-client`) — keeps the current user's profile in sync across
   * every one of their own devices.
   */
  public onMeEvents(callbacks: MeCallbacks): () => void {
    let isUnsubscribed = false;
    let socketInstance: RealtimeSocket | null = null;

    this.createSocket().then((socket) => {
      if (isUnsubscribed) return;
      socketInstance = socket;

      if (callbacks.onMeUpdated) {
        socket.on(MeServerEvents.UPDATED, callbacks.onMeUpdated);
      }
    });

    return () => {
      isUnsubscribed = true;
      if (!socketInstance) return;

      if (callbacks.onMeUpdated) {
        socketInstance.off(MeServerEvents.UPDATED, callbacks.onMeUpdated);
      }
    };
  }

  /**
   * Registers user-follow event callbacks on the shared connection, connecting it first if
   * needed. Returns an unsubscribe function. Meant to be called once app-wide (see
   * `useRealtimeSync` in `@libs/query-client`) — covers both sides of a follow relationship: the
   * follower and the user being followed each get their own devices synced.
   */
  public onUserFollowEvents(callbacks: UserFollowCallbacks): () => void {
    let isUnsubscribed = false;
    let socketInstance: RealtimeSocket | null = null;

    this.createSocket().then((socket) => {
      if (isUnsubscribed) return;
      socketInstance = socket;

      if (callbacks.onUserFollowSet) {
        socket.on(UserFollowServerEvents.SET, callbacks.onUserFollowSet);
      }
      if (callbacks.onUserFollowDeleted) {
        socket.on(UserFollowServerEvents.DELETED, callbacks.onUserFollowDeleted);
      }
      if (callbacks.onUserFollowAccepted) {
        socket.on(UserFollowServerEvents.ACCEPTED, callbacks.onUserFollowAccepted);
      }
      if (callbacks.onUserFollowDeclined) {
        socket.on(UserFollowServerEvents.DECLINED, callbacks.onUserFollowDeclined);
      }
    });

    return () => {
      isUnsubscribed = true;
      if (!socketInstance) return;

      if (callbacks.onUserFollowSet) {
        socketInstance.off(UserFollowServerEvents.SET, callbacks.onUserFollowSet);
      }
      if (callbacks.onUserFollowDeleted) {
        socketInstance.off(UserFollowServerEvents.DELETED, callbacks.onUserFollowDeleted);
      }
      if (callbacks.onUserFollowAccepted) {
        socketInstance.off(UserFollowServerEvents.ACCEPTED, callbacks.onUserFollowAccepted);
      }
      if (callbacks.onUserFollowDeclined) {
        socketInstance.off(UserFollowServerEvents.DECLINED, callbacks.onUserFollowDeclined);
      }
    };
  }

  /**
   * Registers person-follow event callbacks on the shared connection, connecting it first if
   * needed. Returns an unsubscribe function. Meant to be called once app-wide (see
   * `useRealtimeSync` in `@libs/query-client`) — keeps a user's followed persons in sync across
   * every one of their own devices.
   */
  public onPersonFollowEvents(callbacks: PersonFollowCallbacks): () => void {
    let isUnsubscribed = false;
    let socketInstance: RealtimeSocket | null = null;

    this.createSocket().then((socket) => {
      if (isUnsubscribed) return;
      socketInstance = socket;

      if (callbacks.onPersonFollowSet) {
        socket.on(PersonFollowServerEvents.SET, callbacks.onPersonFollowSet);
      }
      if (callbacks.onPersonFollowDeleted) {
        socket.on(PersonFollowServerEvents.DELETED, callbacks.onPersonFollowDeleted);
      }
    });

    return () => {
      isUnsubscribed = true;
      if (!socketInstance) return;

      if (callbacks.onPersonFollowSet) {
        socketInstance.off(PersonFollowServerEvents.SET, callbacks.onPersonFollowSet);
      }
      if (callbacks.onPersonFollowDeleted) {
        socketInstance.off(PersonFollowServerEvents.DELETED, callbacks.onPersonFollowDeleted);
      }
    };
  }

  /**
   * Registers import-job event callbacks on the shared connection, connecting it first if
   * needed. Returns an unsubscribe function. Meant to be called once app-wide (see
   * `useRealtimeSync` in `@libs/query-client`) — covers every import job the user starts, on
   * any device.
   */
  public onImportEvents(callbacks: ImportCallbacks): () => void {
    let isUnsubscribed = false;
    let socketInstance: RealtimeSocket | null = null;

    this.createSocket().then((socket) => {
      if (isUnsubscribed) return;
      socketInstance = socket;

      if (callbacks.onImportCreated) {
        socket.on(ImportServerEvents.CREATED, callbacks.onImportCreated);
      }
      if (callbacks.onImportProgress) {
        socket.on(ImportServerEvents.PROGRESS, callbacks.onImportProgress);
      }
      if (callbacks.onImportStaged) {
        socket.on(ImportServerEvents.STAGED, callbacks.onImportStaged);
      }
      if (callbacks.onImportValidated) {
        socket.on(ImportServerEvents.VALIDATED, callbacks.onImportValidated);
      }
      if (callbacks.onImportFailed) {
        socket.on(ImportServerEvents.FAILED, callbacks.onImportFailed);
      }
      if (callbacks.onImportDeleted) {
        socket.on(ImportServerEvents.DELETED, callbacks.onImportDeleted);
      }
    });

    return () => {
      isUnsubscribed = true;
      if (!socketInstance) return;

      if (callbacks.onImportCreated) {
        socketInstance.off(ImportServerEvents.CREATED, callbacks.onImportCreated);
      }
      if (callbacks.onImportProgress) {
        socketInstance.off(ImportServerEvents.PROGRESS, callbacks.onImportProgress);
      }
      if (callbacks.onImportStaged) {
        socketInstance.off(ImportServerEvents.STAGED, callbacks.onImportStaged);
      }
      if (callbacks.onImportValidated) {
        socketInstance.off(ImportServerEvents.VALIDATED, callbacks.onImportValidated);
      }
      if (callbacks.onImportFailed) {
        socketInstance.off(ImportServerEvents.FAILED, callbacks.onImportFailed);
      }
      if (callbacks.onImportDeleted) {
        socketInstance.off(ImportServerEvents.DELETED, callbacks.onImportDeleted);
      }
    };
  }
}

export const realtime = new RealtimeManager();
