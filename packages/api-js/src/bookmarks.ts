import { BookmarkWithMovie, BookmarkWithTvSeries } from "./__generated__";

export type BookmarkWithMedia = (
	| ({ type: 'movie' } & BookmarkWithMovie)
	| ({ type: 'tv_series' } & BookmarkWithTvSeries)
);
