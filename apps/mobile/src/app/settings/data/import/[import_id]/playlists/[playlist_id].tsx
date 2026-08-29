import { Stack, useLocalSearchParams } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'use-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  importPlaylistsInfiniteOptions,
  importPlaylistItemsInfiniteOptions,
  useImportPatchPlaylistItemMutation,
} from '@libs/query-client';
import { ImportJobPlaylistItem } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../../../../components/ui/text';
import { View } from '../../../../../../components/ui/view';
import { Button } from '../../../../../../components/ui/Button';
import { Badge } from '../../../../../../components/ui/Badge';
import { Card } from '../../../../../../components/ui/card';
import { CardEmpty } from '../../../../../../components/cards/CardEmpty';
import { CardError } from '../../../../../../components/cards/CardError';
import { RefreshableStateContainer } from '../../../../../../components/ui/RefreshableStateContainer';
import { ImageWithFallback } from '../../../../../../components/utils/ImageWithFallback';
import { Icons } from '../../../../../../constants/Icons';
import { useTheme } from '../../../../../../providers/ThemeProvider';
import { useSelectionField } from '../../../../../../stores/useSelectionStore/useSelectionField';
import { getTmdbImage } from '../../../../../../lib/tmdb/getTmdbImage';
import tw from '../../../../../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../../theme/globals';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { LegendList } from '@legendapp/list/react-native';
import { Accordion } from '../../../../../../components/ui/accordion';

const SettingsDataImportPlaylistItemsScreen = () => {
  const t = useTranslations();
  const { isLiquidGlassAvailable } = useTheme();
  const insets = useSafeAreaInsets();
  const navigationHeaderHeight = useHeaderHeight();
  const { import_id, playlist_id } = useLocalSearchParams<{
    import_id: string;
    playlist_id: string;
  }>();
  const jobId = Number(import_id);
  const playlistId = Number(playlist_id);

  const { data: playlists } = useInfiniteQuery(importPlaylistsInfiniteOptions({ id: jobId }));
  const playlist = useMemo(
    () => playlists?.pages.flatMap((page) => page.data).find((p) => p.id === playlistId),
    [playlists, playlistId],
  );

  const { data, isLoading, isError, isRefetching, refetch, hasNextPage, fetchNextPage } =
    useInfiniteQuery(importPlaylistItemsInfiniteOptions({ id: jobId, playlistId }));
  const items = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const renderItem = useCallback(
    ({ item }: { item: ImportJobPlaylistItem }) => (
      <PlaylistItemCard jobId={jobId} playlistId={playlistId} item={item} />
    ),
    [jobId, playlistId],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: playlist?.title ?? upperFirst(t('common.messages.playlist', { count: 1 })),
          headerTransparent: true,
          ...(isLiquidGlassAvailable
            ? {
                headerStyle: { backgroundColor: 'transparent' },
              }
            : {}),
        }}
      />
      {isLoading ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <Icons.Loader />
        </RefreshableStateContainer>
      ) : isError ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <CardError />
        </RefreshableStateContainer>
      ) : items.length === 0 ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <CardEmpty icon={Icons.Playlist} label={upperFirst(t('common.messages.no_results'))} />
        </RefreshableStateContainer>
      ) : (
        <LegendList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isRefetching}
          onRefresh={refetch}
          onEndReached={() => hasNextPage && fetchNextPage()}
          contentContainerStyle={{
            gap: GAP,
            paddingHorizontal: PADDING_HORIZONTAL,
            paddingTop: navigationHeaderHeight,
            paddingBottom: insets.bottom + PADDING_VERTICAL,
          }}
        />
      )}
    </>
  );
};

const PlaylistItemCard = ({
  jobId,
  playlistId,
  item,
}: {
  jobId: number;
  playlistId: number;
  item: ImportJobPlaylistItem;
}) => {
  const t = useTranslations();
  const patchMutation = useImportPatchPlaylistItemMutation();
  const isSkipped = useMemo(() => item.matchStatus === 'skipped', [item.matchStatus]);
  const isUnmatched = useMemo(() => item.matchStatus === 'unmatched', [item.matchStatus]);

  const media = item.type === 'movie' ? item.movie : item.tvSeries;
  const mediaTitle = item.type === 'movie' ? item.movie?.title : item.tvSeries?.name;
  const mediaDate = item.type === 'movie' ? item.movie?.releaseDate : item.tvSeries?.firstAirDate;

  const { openSelector } = useSelectionField(
    item.type,
    (selected) => {
      patchMutation.mutate({
        path: { id: jobId, playlistId, itemId: item.id },
        body: item.type === 'movie' ? { movieId: selected.id } : { tvSeriesId: selected.id },
      });
    },
    item.id,
  );

  const handleMatch = useCallback(() => {
    openSelector({
      pathname:
        item.type === 'movie'
          ? '/settings/data/import/[import_id]/select-movie'
          : '/settings/data/import/[import_id]/select-tv-series',
      params: { import_id: String(jobId) },
    });
  }, [openSelector, jobId, item.type]);

  const handleToggleSkip = useCallback(() => {
    if (isSkipped) {
      if (item.type === 'movie' && item.movieId) {
        patchMutation.mutate({
          path: { id: jobId, playlistId, itemId: item.id },
          body: { movieId: item.movieId },
        });
      } else if (item.type === 'tv_series' && item.tvSeriesId) {
        patchMutation.mutate({
          path: { id: jobId, playlistId, itemId: item.id },
          body: { tvSeriesId: item.tvSeriesId },
        });
      } else {
        patchMutation.mutate({
          path: { id: jobId, playlistId, itemId: item.id },
          body: { matchStatus: 'unmatched' },
        });
      }
    } else {
      patchMutation.mutate({
        path: { id: jobId, playlistId, itemId: item.id },
        body: { matchStatus: 'skipped' },
      });
    }
  }, [
    isSkipped,
    patchMutation,
    jobId,
    playlistId,
    item.id,
    item.type,
    item.movieId,
    item.tvSeriesId,
  ]);

  return (
    <Card style={{ ...tw`p-0`, ...(isSkipped || isUnmatched ? { opacity: 0.5 } : {}) }}>
      <Accordion
        title={
          <View style={tw`flex-row items-center justify-between gap-2`}>
            <View style={tw`flex-1 flex-row items-center gap-2 shrink`}>
              {isUnmatched || !media ? (
                <>
                  <View>
                    <Text numberOfLines={2} style={tw`font-medium`}>
                      {item.rawTitle}
                    </Text>
                    {item.rawYear && <Text style={tw`text-sm`}>{item.rawYear}</Text>}
                  </View>
                  <Badge variant="destructive" style={tw`self-center`}>
                    {upperFirst(t('pages.settings.data.importer.no_match'))}
                  </Badge>
                </>
              ) : (
                <>
                  <ImageWithFallback
                    source={{ uri: getTmdbImage({ path: media.posterPath, size: 'w185' }) }}
                    alt={mediaTitle ?? item.rawTitle}
                    type={item.type}
                    style={{ width: 45, aspectRatio: 2 / 3 }}
                  />
                  <View style={tw`shrink gap-1`}>
                    <Text numberOfLines={2} style={tw`font-medium`}>
                      {mediaTitle ?? item.rawTitle}
                    </Text>
                    {mediaDate && (
                      <Text textColor="muted" style={tw`text-sm`}>
                        {new Date(mediaDate).getFullYear()}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </View>
            <Badge variant="outline" style={tw`self-center`}>
              {item.type === 'tv_series'
                ? upperFirst(t('common.messages.tv_series', { count: 1 }))
                : upperFirst(t('common.messages.movie', { count: 1 }))}
            </Badge>
          </View>
        }
        containerStyle={tw`p-2`}
      >
        <View style={tw`pt-2`}>
          <View style={tw`flex-row items-center justify-between gap-2`}>
            <Button
              variant="outline"
              icon={Icons.Puzzle}
              onPress={handleMatch}
              containerStyle={tw`shrink flex-1`}
            >
              {upperFirst(t('common.messages.fix'))}
            </Button>
            {!isUnmatched && (
              <Button
                variant="outline"
                icon={isSkipped ? Icons.Undo : Icons.X}
                onPress={handleToggleSkip}
                containerStyle={tw`shrink flex-1`}
              >
                {isSkipped
                  ? upperFirst(t('common.messages.restore'))
                  : upperFirst(t('common.messages.skip'))}
              </Button>
            )}
          </View>
        </View>
      </Accordion>
    </Card>
  );
};

export default SettingsDataImportPlaylistItemsScreen;
