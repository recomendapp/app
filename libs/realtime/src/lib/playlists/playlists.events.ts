export interface IPlaylistItemUpdatedSignal {
  id: number;
  playlistId: number;
  rank: string;
  comment: string | null;
}

export interface IPlaylistItemsDeletedSignal {
  playlistId: number;
  itemIds: number[];
}
