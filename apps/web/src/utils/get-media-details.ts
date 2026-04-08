import { Movie, MovieCompact, Person, PersonCompact, TvEpisode, TvSeasonCompact, TvSeries, TvSeriesCompact } from "@libs/api-js";

type MediaType = 'movie' | 'tv_series';

interface MediaBaseProps {
	type: MediaType;
};
type MediaMovieDetailsProps = {
	type: 'movie',
	media: MovieCompact | Movie;
};
type MediaTvSeriesDetailsProps = {
	type: 'tv_series',
	media: TvSeriesCompact | TvSeries;
};
type MediaTvSeriesSeasonDetailsProps = {
	type: 'tv_season',
	media: TvSeasonCompact;
};
type MediaTvSeriesEpisodeDetailsProps = {
	type: 'tv_episode',
	media: TvEpisode;
};
type MediaPersonDetailsProps = {
	type: 'person',
	media: PersonCompact | Person;
};
export type MediaDetailsProps = MediaBaseProps & (
	MediaMovieDetailsProps
	| MediaTvSeriesDetailsProps
	| MediaTvSeriesSeasonDetailsProps
	| MediaTvSeriesEpisodeDetailsProps
	| MediaPersonDetailsProps
);

const getMediaDetails = ({
	type,
	media
} : MediaDetailsProps) => {
	const getTitle = () => {
		switch (type) {
			case 'movie':
				return media.title;
			case 'tv_series':
				return media.name;
			default:
				return null;
		}
	};
	const getImagePath = () => {
		switch (type) {
			case 'movie':
				return media.posterPath;
			case 'tv_series':
				return media.posterPath;
			default:
				return null;
		}
	};
	const getDate = () => {
		switch (type) {
			case 'movie':
				return media.releaseDate;
			case 'tv_series':
				return media.firstAirDate;
			default:
				return null;
		}
	};
	const getCredits = () => {
		switch (type) {
			case 'movie':
				return media.directors;
			case 'tv_series':
				return media.createdBy;
			default:
				return [];
		}
	};
	return {
		title: getTitle(),
		imagePath: getImagePath(),
		date: getDate(),
		credits: getCredits(),
		posterClassName: type === 'movie'
			? 'aspect-2/3 rounded-md'
			: type === 'tv_series'
			? 'aspect-2/3 rounded-md'
			: 'aspect-2/3 rounded-md',
	}

};

const getMediaUrlPrefix = (type: MediaType) => {
	switch (type) {
		case 'movie':
			return '/film';
		case 'tv_series':
			return '/tv-series';
		default:
			return '';
	}
}

const getMediaUrl = ({ id, type, slug }: { id?: number; type?: MediaType; slug?: string | null }) => {
	if (!id || !type) return '';
	return `${getMediaUrlPrefix(type)}/${slug ?? id}`;
}

export {
	getMediaDetails,
	getMediaUrl,
	getMediaUrlPrefix,
};