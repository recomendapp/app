import { BestResultMovie, BestResultPerson, BestResultPlaylist, BestResultTvSeries, BestResultUser } from "./__generated__";

export type SearchBestResultItem = (
	| ({ type: "movie" } & BestResultMovie)
	| ({ type: "tv_series" } & BestResultTvSeries)
	| ({ type: "person" } & BestResultPerson)
	| ({ type: "user" } & BestResultUser)
	| ({ type: "playlist" } & BestResultPlaylist)
);
