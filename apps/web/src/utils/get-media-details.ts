import { MediaMovie, MediaPerson, MediaTvSeries, MediaTvSeriesEpisode, MediaTvSeriesSeason, MediaType } from "@recomendapp/types";


interface MediaBaseProps {
	type: MediaType;
};
type MediaMovieDetailsProps = {
	type: 'movie',
	media: MediaMovie
};
type MediaTvSeriesDetailsProps = {
	type: 'tv_series',
	media: MediaTvSeries
};
type MediaTvSeriesSeasonDetailsProps = {
	type: 'tv_season',
	media: MediaTvSeriesSeason
};
type MediaTvSeriesEpisodeDetailsProps = {
	type: 'tv_episode',
	media: MediaTvSeriesEpisode
};
type MediaPersonDetailsProps = {
	type: 'person',
	media: MediaPerson
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
			case 'person':
				return media.name;
			default:
				return null;
		}
	};
	const getImageUrl = () => {
		switch (type) {
			case 'movie':
				return media.poster_url;
			case 'tv_series':
				return media.poster_url;
			case 'person':
				return media.profile_url;
			default:
				return null;
		}
	};
	const getImagePath = () => {
		switch (type) {
			case 'movie':
				return media.poster_path;
			case 'tv_series':
				return media.poster_path;
			case 'person':
				return media.profile_path;
			default:
				return null;
		}
	};
	const getDate = () => {
		switch (type) {
			case 'movie':
				return media.release_date;
			case 'tv_series':
				return media.first_air_date;
			case 'person':
				return media.birthday;
			default:
				return null;
		}
	};
	const getDescription = () => {
		switch (type) {
			case 'movie':
				return media.overview;
			case 'tv_series':
				return media.overview;
			case 'person':
				return media.biography;
			default:
				return null;
		}
	};
	return {
		title: getTitle(),
		imageUrl: getImageUrl(),
		imagePath: getImagePath(),
		date: getDate(),
		description: getDescription(),
		posterClassName: type === 'movie'
			? 'aspect-2/3 rounded-md'
			: type === 'tv_series'
			? 'aspect-2/3 rounded-md'
			: type === 'person'
			? 'aspect-square rounded-full'
			: 'aspect-2/3 rounded-md',
	}

};

const getMediaUrlPrefix = (type: MediaType) => {
	switch (type) {
		case 'movie':
			return '/film';
		case 'tv_series':
			return '/tv-series';
		case 'person':
			return '/person';
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