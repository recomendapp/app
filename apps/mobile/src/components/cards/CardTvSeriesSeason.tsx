import * as React from 'react';
import Animated from 'react-native-reanimated';
import { ImageWithFallback } from '../utils/ImageWithFallback';
import { Href, Link } from 'expo-router';
import tw from '../../lib/tw';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { upperFirst } from 'lodash';
import { IconMediaRating } from '../medias/IconMediaRating';
import { useTranslations } from 'use-intl';
import { Text } from '../ui/text';
import { getTmdbImage } from '../../lib/tmdb/getTmdbImage';
import { TvSeasonCompact } from '@libs/api-js';

interface CardTvSeriesSeasonProps extends React.ComponentPropsWithRef<typeof Animated.View> {
  variant?: 'default' | 'poster' | 'row';
  season: TvSeasonCompact;
  linked?: boolean;
  disableActions?: boolean;
  showRating?: boolean;
  showAction?: {
    rating?: boolean;
  };
  hideMediaType?: boolean;
  index?: number;
  children?: React.ReactNode;
}

const CardTvSeriesSeasonDefault = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  Omit<CardTvSeriesSeasonProps, 'variant'> & {
    // Only true when this card is actually rendered inside a <Link> (see CardTvSeriesSeason
    // below) — Link.AppleZoom throws if used outside one.
    enableZoomTransition?: boolean;
  }
>(
  (
    { style, season, showAction, children, linked, showRating, enableZoomTransition, ...props },
    ref,
  ) => {
    const { colors } = useTheme();
    const t = useTranslations();
    const poster = (
      <ImageWithFallback
        source={{ uri: getTmdbImage({ path: season.posterPath, size: 'w342' }) ?? '' }}
        alt={season.id.toString() ?? ''}
        type={'tv_season'}
        // Slot (used by Link.AppleZoom below) throws if its single child's style is an array —
        // must be a flattened object instead.
        style={{ aspectRatio: 2 / 3, ...tw`h-auto` }}
      >
        {showRating && (
          <IconMediaRating
            rating={season.voteAverage}
            variant="general"
            style={tw`absolute top-1 right-1`}
          />
        )}
      </ImageWithFallback>
    );
    return (
      <Animated.View
        ref={ref}
        style={[
          { backgroundColor: colors.card, borderColor: colors.border },
          tw`items-center rounded-xl w-32 p-1 gap-2 border h-auto`,
          style,
        ]}
        {...props}
      >
        {enableZoomTransition ? <Link.AppleZoom>{poster}</Link.AppleZoom> : poster}

        <View style={tw`shrink px-2 py-1 gap-1`}>
          <Text numberOfLines={1} style={tw`text-center`}>
            {season.seasonNumber === 0
              ? upperFirst(t('common.messages.tv_special_episode', { count: season.episodeCount }))
              : upperFirst(t('common.messages.tv_season_value', { number: season.seasonNumber }))}
          </Text>
          <Text numberOfLines={1} style={[tw`text-center`, { color: colors.mutedForeground }]}>
            {upperFirst(t('common.messages.tv_episode_count', { count: season.episodeCount }))}
          </Text>
          {children}
        </View>
      </Animated.View>
    );
  },
);
CardTvSeriesSeasonDefault.displayName = 'CardTvSeriesSeasonDefault';

const CardTvSeriesSeason = React.forwardRef<
  React.ComponentRef<typeof Animated.View>,
  CardTvSeriesSeasonProps
>(
  (
    { hideMediaType = true, showRating = true, linked = true, variant = 'default', ...props },
    ref,
  ) => {
    const href: Href = {
      pathname: '/tv-series/[tv_series_id]/season/[season_number]',
      params: {
        tv_series_id: props.season.tvSeriesId.toString(),
        season_number: props.season.seasonNumber.toString(),
      },
    };

    const content =
      variant === 'default' ? (
        <CardTvSeriesSeasonDefault
          ref={ref}
          linked={linked}
          showRating={showRating}
          enableZoomTransition={linked}
          {...props}
        />
      ) : null;

    if (!linked) {
      return <Pressable>{content}</Pressable>;
    }

    return (
      <Link href={href} asChild>
        <Pressable>{content}</Pressable>
      </Link>
    );
  },
);
CardTvSeriesSeason.displayName = 'CardTvSeriesSeason';

export { type CardTvSeriesSeasonProps, CardTvSeriesSeason, CardTvSeriesSeasonDefault };
