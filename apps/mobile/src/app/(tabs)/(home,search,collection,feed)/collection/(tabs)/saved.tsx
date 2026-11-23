import { CardPlaylist } from '../../../../../components/cards/CardPlaylist';
import { useAuth } from '../../../../../providers/AuthProvider';
import tw from '../../../../../lib/tw';
import { useWindowDimensions, View } from 'react-native';
import { LegendList } from '@legendapp/list/react-native';
import { Icons } from '../../../../../constants/Icons';
import { useTranslations } from 'use-intl';
import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userPlaylistsSavedInfiniteOptions } from '@libs/query-client';
import { PlaylistWithOwner } from '@libs/api-js';
import { RefreshableStateContainer } from '../../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../../components/cards/CardError';
import { CardEmpty } from '../../../../../components/cards/CardEmpty';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../../providers/ThemeProvider';

const CollectionSavedScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const t = useTranslations();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data, isLoading, fetchNextPage, refetch, hasNextPage, isError, isRefetching } =
    useInfiniteQuery(
      userPlaylistsSavedInfiniteOptions({
        userId: user?.id,
      }),
    );
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
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spaces.md }}
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
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spaces.md }}
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
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spaces.md }}
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
        paddingTop: theme.spaces.md,
        paddingLeft: insets.left + theme.spaces.horizontal,
        paddingRight: insets.right + theme.spaces.horizontal,
        paddingBottom: insets.bottom + theme.spaces.md,
      }}
      maintainVisibleContentPosition={false}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      keyExtractor={(item) => item.id.toString()}
      onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
      onEndReachedThreshold={0.3}
      nestedScrollEnabled
    />
  );
};

export default CollectionSavedScreen;
