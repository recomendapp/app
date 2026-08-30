import {
  PinnedItemWithMovie,
  PinnedItemWithPerson,
  PinnedItemWithPlaylist,
  PinnedItemWithTvSeries,
} from './__generated__';

export type PinnedItemWithData =
  | PinnedItemWithMovie
  | PinnedItemWithTvSeries
  | PinnedItemWithPlaylist
  | PinnedItemWithPerson;
