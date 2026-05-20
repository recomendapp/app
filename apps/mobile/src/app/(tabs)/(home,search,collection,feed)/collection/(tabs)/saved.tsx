import { CardPlaylist } from '../../../../../components/cards/CardPlaylist';
import { useAuth } from '../../../../../providers/AuthProvider';
import tw from '../../../../../lib/tw';
import { useWindowDimensions, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { Icons } from '../../../../../constants/Icons';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { useTranslations } from 'use-intl';
import { useCallback, useMemo } from 'react';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userPlaylistsSavedInfiniteOptions } from '@libs/query-client';
import { PlaylistWithOwner } from '@libs/api-js';
import { RefreshableStateContainer } from '../../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../../components/cards/CardError';
import { CardEmpty } from '../../../../../components/cards/CardEmpty';

const CollectionSavedScreen = () => {
  const { user } = useAuth();
  const t = useTranslations();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { colors, bottomOffset, tabBarHeight } = useTheme();
  const { data, isLoading, fetchNextPage, refetch, hasNextPage, isError, isRefetching } =
    useInfiniteQuery(
      userPlaylistsSavedInfiniteOptions({
        userId: user?.id,
      }),
    );
  const loading = isLoading || data === undefined;
  const playlists = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const renderItem = useCallback(
    ({ item: { owner, ...playlist } }: { item: PlaylistWithOwner }) => (
      <View style={tw`p-1`}>
        <CardPlaylist playlist={playlist} owner={owner} style={tw`w-full`} />
      </View>
    ),
    [],
  );
  if (isLoading) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: bottomOffset + PADDING_VERTICAL }}
      >
        <Icons.Loader />
      </RefreshableStateContainer>
    );
  }

  if (isError) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: bottomOffset + PADDING_VERTICAL }}
      >
        <CardError />
      </RefreshableStateContainer>
    );
  }

  if (playlists.length === 0) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: bottomOffset + PADDING_VERTICAL }}
      >
        <CardEmpty icon={'📚'} label={t('help_hints.playlists.saved.empty')} />
      </RefreshableStateContainer>
    );
  }
  return (
    <LegendList
      data={playlists}
      renderItem={renderItem}
      onRefresh={refetch}
      numColumns={
        SCREEN_WIDTH < 360
          ? 2
          : SCREEN_WIDTH < 414
            ? 3
            : SCREEN_WIDTH < 600
              ? 4
              : SCREEN_WIDTH < 768
                ? 5
                : 6
      }
      contentContainerStyle={{
        paddingHorizontal: PADDING_HORIZONTAL,
        paddingBottom: bottomOffset + PADDING_VERTICAL,
      }}
      maintainVisibleContentPosition={false}
      scrollIndicatorInsets={{ bottom: tabBarHeight }}
      keyExtractor={(item) => item.id.toString()}
      onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
      onEndReachedThreshold={0.3}
      nestedScrollEnabled
    />
  );
};

export default CollectionSavedScreen;
