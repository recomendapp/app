import { BORDER_RADIUS } from '../../theme/globals';
import { Href } from 'expo-router';
import {
  Movie,
  MovieCompact,
  Person,
  PersonCompact,
  TvEpisode,
  TvSeasonCompact,
  TvSeries,
  TvSeriesCompact,
} from '@libs/api-js';
import { StyleProp, ViewStyle } from 'react-native';

type MediaType = 'movie' | 'tv_series' | 'tv_season' | 'tv_episode' | 'person';

interface MediaBaseProps {
  type: MediaType;
}
type MediaMovieDetailsProps = {
  type: 'movie';
  media: MovieCompact | Movie;
};
type MediaTvSeriesDetailsProps = {
  type: 'tv_series';
  media: TvSeriesCompact | TvSeries;
};
type MediaTvSeriesSeasonDetailsProps = {
  type: 'tv_season';
  media: TvSeasonCompact;
};
type MediaTvSeriesEpisodeDetailsProps = {
  type: 'tv_episode';
  media: TvEpisode;
};
type MediaPersonDetailsProps = {
  type: 'person';
  media: PersonCompact | Person;
};

export type MediaDetailsProps = MediaBaseProps &
  (
    | MediaMovieDetailsProps
    | MediaTvSeriesDetailsProps
    | MediaTvSeriesSeasonDetailsProps
    | MediaTvSeriesEpisodeDetailsProps
    | MediaPersonDetailsProps
  );

const getMediaDetails = ({ type, media }: MediaDetailsProps) => {
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
  const getImageStyle = (): StyleProp<ViewStyle> => {
    switch (type) {
      case 'movie':
      case 'tv_series':
      case 'person':
        return { aspectRatio: 2 / 3, borderRadius: BORDER_RADIUS };
      default:
        return {};
    }
  };
  const getUrl = (): Href => {
    switch (type) {
      case 'movie':
        return `/film/${media.slug ?? media.id}`;
      case 'tv_series':
        return `/tv-series/${media.slug ?? media.id}`;
      case 'person':
        return `/person/${media.slug ?? media.id}`;
      case 'tv_season':
        return `/tv-series/${media.tvSeriesId}/season/${media.seasonNumber}`;
      case 'tv_episode':
        return `/tv-series/${media.tvSeriesId}/season/${media.seasonNumber}/episode/${media.episodeNumber}`;
      default:
        return '/';
    }
  };
  return {
    title: getTitle(),
    imagePath: getImagePath(),
    date: getDate(),
    credits: getCredits(),
    style: getImageStyle(),
    url: getUrl(),
    posterClassName:
      type === 'movie'
        ? 'aspect-[2/3] rounded-md'
        : type === 'tv_series'
          ? 'aspect-[2/3] rounded-md'
          : type === 'person'
            ? 'aspect-[1/1] rounded-full'
            : 'aspect-[2/3] rounded-md',
  };
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
};

const getMediaUrl = ({
  id,
  type,
  slug,
}: {
  id?: number;
  type?: MediaType;
  slug?: string | null;
}) => {
  if (!id || !type) return '';
  return `${getMediaUrlPrefix(type)}/${slug ?? id}`;
};

export { getMediaDetails, getMediaUrl, getMediaUrlPrefix };
