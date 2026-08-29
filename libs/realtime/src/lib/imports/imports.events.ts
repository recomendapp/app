export interface IImportDeletedSignal {
  importId: number;
  userId: string;
}

// Shared by log-movie/log-tv-series/bookmark/playlist patch events: the item itself, plus the
// parent import job id since (unlike the job-level events) these DTOs don't carry it themselves.
export interface IImportSubItemPatchedSignal<T> {
  importJobId: number;
  item: T;
}

// Review patches are displayed via the embedded `review` field on the parent item's list query,
// not a separate cache entry — so the signal carries the parent item's id (itemId) to merge into,
// not the review row's own id.
export interface IImportSubItemReviewPatchedSignal<T> {
  importJobId: number;
  itemId: number;
  review: T;
}

// Playlist items are nested one level deeper (import job -> playlist -> item), so their cache key
// also needs the playlist id.
export interface IImportPlaylistItemPatchedSignal<T> {
  importJobId: number;
  playlistId: number;
  item: T;
}
