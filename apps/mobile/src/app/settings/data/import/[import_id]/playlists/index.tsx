import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'use-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import { importPlaylistsInfiniteOptions, useImportPatchPlaylistMutation } from '@libs/query-client';
import { ImportJobPlaylist } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../../../../components/ui/Button';
import { Text } from '../../../../../../components/ui/text';
import { View } from '../../../../../../components/ui/view';
import { CardEmpty } from '../../../../../../components/cards/CardEmpty';
import { CardError } from '../../../../../../components/cards/CardError';
import { RefreshableStateContainer } from '../../../../../../components/ui/RefreshableStateContainer';
import { Icons } from '../../../../../../constants/Icons';
import { useTheme } from '../../../../../../providers/ThemeProvider';
import tw from '../../../../../../lib/tw';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../../theme/globals';
import { LegendList } from '@legendapp/list/react-native';
import { useHeaderHeight } from 'expo-router/react-navigation';

const SettingsDataImportPlaylistsScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const { colors, isLiquidGlassAvailable } = useTheme();
  const insets = useSafeAreaInsets();
  const navigationHeaderHeight = useHeaderHeight();
  const patchMutation = useImportPatchPlaylistMutation();
  const { import_id } = useLocalSearchParams<{ import_id: string }>();
  const jobId = Number(import_id);

  const { data, isLoading, isError, isRefetching, refetch, hasNextPage, fetchNextPage } =
    useInfiniteQuery(importPlaylistsInfiniteOptions({ id: jobId }));
  const items = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const handleToggleSkip = useCallback(
    (item: ImportJobPlaylist) => {
      patchMutation.mutate({
        path: { id: jobId, itemId: item.id },
        body: { matchStatus: item.matchStatus === 'skipped' ? 'matched' : 'skipped' },
      });
    },
    [patchMutation, jobId],
  );

  const renderItem = useCallback(
    ({ item }: { item: ImportJobPlaylist }) => {
      const isSkipped = item.matchStatus === 'skipped';
      return (
        <View style={tw`flex-row items-center gap-1`}>
          <Button
            variant="ghost"
            size="fit"
            onPress={() =>
              router.push({
                pathname: '/settings/data/import/[import_id]/playlists/[playlist_id]',
                params: { import_id, playlist_id: String(item.id) },
              })
            }
            containerStyle={tw`shrink flex-1`}
            style={{ paddingVertical: PADDING_HORIZONTAL, paddingHorizontal: PADDING_HORIZONTAL }}
          >
            <View style={tw`flex-1 flex-row items-center justify-between gap-2`}>
              <Text numberOfLines={1} style={isSkipped ? { opacity: 0.5 } : undefined}>
                {item.title}
              </Text>
              <Icons.ChevronRight color={colors.mutedForeground} size={16} />
            </View>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            icon={isSkipped ? Icons.Undo : Icons.X}
            iconProps={{
              color: colors.mutedForeground,
            }}
            onPress={() => handleToggleSkip(item)}
          />
        </View>
      );
    },
    [router, import_id, colors.mutedForeground, handleToggleSkip],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: upperFirst(t('pages.settings.data.importer.categories.playlists')),
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
          ItemSeparatorComponent={() => (
            <View style={[{ backgroundColor: colors.muted, height: 1 }, tw`w-full`]} />
          )}
          contentContainerStyle={{
            paddingTop: navigationHeaderHeight,
            paddingBottom: insets.bottom + PADDING_VERTICAL,
          }}
        />
      )}
    </>
  );
};

export default SettingsDataImportPlaylistsScreen;
