import { PlaylistItemWithMovie, PlaylistItemWithTvSeries } from "./__generated__";

export type PlaylistItemWithMedia = (
	| ({ type: 'movie' } & PlaylistItemWithMovie)
	| ({ type: 'tv_series' } & PlaylistItemWithTvSeries)
);