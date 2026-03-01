export type BookmarkTarget =
  | { id: number; movieId?: never; tvSeriesId?: never }
  | { id?: never; movieId: number; tvSeriesId?: never }
  | { id?: never; movieId?: never; tvSeriesId: number };