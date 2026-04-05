import { RecoWithMovie, RecoWithTvSeries } from "./__generated__";

export type RecoWithMedia = (
	| ({ type: 'movie' } & RecoWithMovie)
	| ({ type: 'tv_series' } & RecoWithTvSeries)
);
