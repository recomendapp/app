import tw from '../../../lib/tw';
import { useWindowDimensions, View } from 'react-native';
import { clamp, upperFirst } from 'lodash';
import { Href, Link } from 'expo-router';
import { useTheme } from '../../../providers/ThemeProvider';
import { Icons } from '../../../constants/Icons';
import { useTranslations } from 'use-intl';
import { Text } from '../../ui/text';
import { MultiRowHorizontalList } from '../../ui/MultiRowHorizontalList';
import { CardTvSeries } from '../../cards/CardTvSeries';
import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { personTvSeriesInfiniteOptions } from '@libs/query-client';
import { PersonTvSeries } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PersonWidgetTvSeriesProps extends React.ComponentPropsWithoutRef<typeof View> {
  personId: number;
  url: Href;
}

const PersonWidgetTvSeries = ({ personId, url, style }: PersonWidgetTvSeriesProps) => {
  const { colors, theme } = useTheme();
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const width = useMemo(
    () => clamp(screenWidth - (theme.spaces.horizontal * 2 + theme.spaces.md * 2), 400),
    [screenWidth, theme],
  );
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery(
    personTvSeriesInfiniteOptions({
      personId,
    }),
  );
  const tvSeries = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);
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
            {upperFirst(t('common.messages.tv_series', { count: 2 }))}
          </Text>
          <Icons.ChevronRight color={colors.mutedForeground} />
        </View>
      </Link>
      <MultiRowHorizontalList<PersonTvSeries>
        key={loading ? 'loading' : 'tv_series'}
        data={loading ? new Array(3).fill(null) : tvSeries}
        renderItem={(item) => (
          <CardTvSeries
            variant="list"
            {...(!loading
              ? {
                  tvSeries: item.tvSeries,
                }
              : {
                  skeleton: true,
                })}
          />
        )}
        ListEmptyComponent={
          <Text style={[tw``, { color: colors.mutedForeground }]}>
            {upperFirst(t('common.messages.no_tv_series'))}
          </Text>
        }
        keyExtractor={(item, index) => (loading ? index.toString() : item.tvSeries.id.toString())}
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

export default PersonWidgetTvSeries;
