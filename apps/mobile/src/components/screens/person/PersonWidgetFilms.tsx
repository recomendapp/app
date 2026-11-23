import tw from '../../../lib/tw';
import { useWindowDimensions, View } from 'react-native';
import { clamp, upperFirst } from 'lodash';
import { Href, Link } from 'expo-router';
import { useTheme } from '../../../providers/ThemeProvider';
import { Icons } from '../../../constants/Icons';
import { useTranslations } from 'use-intl';
import { Text } from '../../ui/text';
import { CardMovie } from '../../cards/CardMovie';
import { MultiRowHorizontalList } from '../../ui/MultiRowHorizontalList';
import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { personMoviesInfiniteOptions } from '@libs/query-client';
import { PersonMovie } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PersonWidgetFilmsProps extends React.ComponentPropsWithoutRef<typeof View> {
  personId: number;
  url: Href;
}

const PersonWidgetFilms = ({ personId, url, style }: PersonWidgetFilmsProps) => {
  const { colors, theme } = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const width = useMemo(
    () => clamp(screenWidth - (theme.spaces.horizontal * 2 + theme.spaces.md * 2), 400),
    [screenWidth, theme],
  );
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery(
    personMoviesInfiniteOptions({
      personId,
    }),
  );
  const movies = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);
  const loading = data === undefined || isLoading;
  return (
    <View style={[tw`gap-1`, style]}>
      <Link
        href={url}
        style={{
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
        }}
      >
        <View style={tw`flex-row items-center`}>
          <Text style={tw`font-medium text-lg`} numberOfLines={1}>
            {upperFirst(t('common.messages.film', { count: 2 }))}
          </Text>
          <Icons.ChevronRight color={colors.mutedForeground} />
        </View>
      </Link>
      <MultiRowHorizontalList<PersonMovie>
        key={loading ? 'loading' : 'movie'}
        data={loading ? new Array(3).fill(null) : movies}
        renderItem={(item) => (
          <CardMovie
            variant="list"
            {...(!loading
              ? {
                  movie: item.movie,
                }
              : {
                  skeleton: true,
                })}
          />
        )}
        ListEmptyComponent={
          <Text style={[tw``, { color: colors.mutedForeground }]}>
            {upperFirst(t('common.messages.no_films'))}
          </Text>
        }
        keyExtractor={(item, index) => (loading ? index.toString() : item.movie.id.toString())}
        contentContainerStyle={{
          paddingLeft: insets.left + theme.spaces.horizontal,
          paddingRight: insets.right + theme.spaces.horizontal,
          gap: theme.spaces.md,
        }}
        columnStyle={{
          width: width,
          gap: theme.spaces.md,
        }}
        snapToInterval={width + theme.spaces.md}
        decelerationRate={'fast'}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

export default PersonWidgetFilms;
