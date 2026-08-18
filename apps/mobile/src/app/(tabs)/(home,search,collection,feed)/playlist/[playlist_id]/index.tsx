import { Icons } from '../../../../../constants/Icons';
import useBottomSheetStore from '../../../../../stores/useBottomSheetStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomSheetPlaylist from '../../../../../components/bottom-sheets/sheets/BottomSheetPlaylist';
import { View } from '../../../../../components/ui/view';
import tw from '../../../../../lib/tw';
import { Button } from '../../../../../components/ui/Button';
import AnimatedStackScreen from '../../../../../components/ui/AnimatedStackScreen';
import { useSharedValue } from 'react-native-reanimated';
import ButtonActionPlaylistLike from '../../../../../components/buttons/ButtonActionPlaylistLike';
import ButtonActionPlaylistSaved from '../../../../../components/buttons/ButtonActionPlaylistSaved';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { useAuth } from '../../../../../providers/AuthProvider';
import {
  playlistItemsAllOptions,
  playlistOptions,
  usePlaylistDeleteMutation,
  usePlaylistItemsDeleteMutation,
  usePlaylistItemUpdateMutation,
  useUserPlaylistLike,
  useUserPlaylistSaved,
} from '@libs/query-client';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '../../../../../stores/useUIStore';
import { useToast } from '../../../../../components/Toast';
import { useCallback, useMemo } from 'react';
import { canEditPlaylist, canEditPlaylistItem, PlaylistItemWithMedia } from '@libs/api-js';
import { Alert } from 'react-native';
import richTextToPlainString from '../../../../../utils/richTextToPlainString';
import { BottomSheetComment } from '../../../../../components/bottom-sheets/sheets/BottomSheetComment';
import BottomSheetSharePlaylist from '../../../../../components/bottom-sheets/sheets/share/BottomSheetSharePlaylist';
import { CardUser } from '../../../../../components/cards/CardUser';
import { Text } from '../../../../../components/ui/text';
import CollectionScreen, {
  CollectionAction,
  CollectionMenuItem,
  SortByOption,
} from '../../../../../components/collection/CollectionScreen';
import BottomSheetMovie from '../../../../../components/bottom-sheets/sheets/BottomSheetMovie';
import BottomSheetTvSeries from '../../../../../components/bottom-sheets/sheets/BottomSheetTvSeries';
import { getTmdbImage } from '../../../../../lib/tmdb/getTmdbImage';

const PlaylistScreen = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { mode } = useTheme();
  const { playlist_id } = useLocalSearchParams();
  const view = useUIStore((state) => state.playlistView);
  const setPlaylistView = useUIStore((state) => state.setPlaylistView);
  const playlistId = Number(playlist_id) || undefined;
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  const toast = useToast();
  const router = useRouter();
  // Queries
  const { data: playlist } = useQuery(
    playlistOptions({
      playlistId: playlistId,
    }),
  );
  const items = useQuery(
    playlistItemsAllOptions({
      playlistId,
    }),
  );
  const { isLiked, toggle: toggleLike } = useUserPlaylistLike({
    userId: user && playlist && user.id === playlist.userId ? undefined : user?.id,
    playlistId: playlist?.id,
  });
  const { isSaved, toggle: toggleSaved } = useUserPlaylistSaved({
    userId: user && playlist && user.id === playlist.userId ? undefined : user?.id,
    playlistId: playlist?.id,
  });
  // Mutations
  const { mutateAsync: updateItem } = usePlaylistItemUpdateMutation();
  const { mutateAsync: deleteItem } = usePlaylistItemsDeleteMutation();
  const { mutateAsync: deletePlaylist } = usePlaylistDeleteMutation();
  const canEditItem = useMemo(() => canEditPlaylistItem(playlist?.role || null), [playlist?.role]);
  const canEditThisPlaylist = useMemo(
    () => canEditPlaylist(playlist?.role || null),
    [playlist?.role],
  );

  // SharedValues
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(0);

  // Handlers
  const handleDeletePlaylistItem = useCallback(
    (data: PlaylistItemWithMedia) => {
      const title =
        (data.type === 'movie' ? data.media.title : data.media.name) ||
        upperFirst(t('common.messages.unknown'));
      Alert.alert(
        upperFirst(t('common.messages.are_u_sure')),
        upperFirst(
          richTextToPlainString(
            t.rich('pages.playlist.modal.delete_item_confirm.description', {
              title: title,
              important: (chunk) => `"${chunk}"`,
            }),
          ),
        ),
        [
          {
            text: upperFirst(t('common.messages.cancel')),
            style: 'cancel',
          },
          {
            text: upperFirst(t('common.messages.delete')),
            onPress: async () => {
              await deleteItem(
                {
                  path: {
                    playlist_id: data.playlistId,
                  },
                  body: {
                    itemIds: [data.id],
                  },
                },
                {
                  onSuccess: () => {
                    toast.success(
                      upperFirst(t('common.messages.deleted', { count: 1, gender: 'male' })),
                    );
                  },
                  onError: () => {
                    toast.error(upperFirst(t('common.messages.error')), {
                      description: upperFirst(t('common.messages.an_error_occurred')),
                    });
                  },
                },
              );
            },
            style: 'destructive',
          },
        ],
        {
          userInterfaceStyle: mode,
        },
      );
    },
    [t, deleteItem, toast, mode],
  );
  const handlePlaylistItemComment = useCallback(
    (data: PlaylistItemWithMedia) => {
      openSheet(BottomSheetComment, {
        comment: data.comment || '',
        isAllowedToEdit: canEditItem,
        onSave: async (newComment) => {
          await updateItem(
            {
              path: {
                playlist_id: data.playlistId,
                item_id: data.id,
              },
              body: {
                comment: newComment?.replace(/\s+/g, ' ').trimStart() || null,
              },
            },
            {
              onError: () => {
                toast.error(upperFirst(t('common.messages.error')), {
                  description: upperFirst(t('common.messages.an_error_occurred')),
                });
              },
            },
          );
        },
      });
    },
    [openSheet, canEditItem, updateItem, toast, t],
  );
  const handleDeletePlaylist = useCallback(() => {
    if (!playlist) return;
    Alert.alert(
      upperFirst(t('common.messages.are_u_sure')),
      upperFirst(
        richTextToPlainString(
          t.rich('pages.playlist.actions.delete.description', {
            title: playlist.title,
            important: (chunk) => `"${chunk}"`,
          }),
        ),
      ),
      [
        { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
        {
          text: upperFirst(t('common.messages.delete')),
          onPress: () => {
            deletePlaylist(
              { path: { playlist_id: playlist.id } },
              {
                onSuccess: () => {
                  toast.success(upperFirst(t('common.messages.deleted')));
                  router.replace('/collection');
                },
                onError: () => {
                  toast.error(upperFirst(t('common.messages.error')), {
                    description: upperFirst(t('common.messages.an_error_occurred')),
                  });
                },
              },
            );
          },
          style: 'destructive',
        },
      ],
      { userInterfaceStyle: mode },
    );
  }, [playlist, deletePlaylist, toast, t, mode, router]);

  const sortByOptions = useMemo(
    (): SortByOption<PlaylistItemWithMedia>[] => [
      {
        label: upperFirst(t('common.messages.custom_sort')),
        value: 'rank',
        defaultOrder: 'asc',
        sortFn: (a, b, order) => {
          const rankA = a.rank;
          const rankB = b.rank;
          return order === 'asc' ? rankA.localeCompare(rankB) : rankB.localeCompare(rankA);
        },
      },
      {
        label: upperFirst(t('common.messages.alphabetical')),
        value: 'alphabetical',
        defaultOrder: 'asc',
        sortFn: (a, b, order) => {
          const titleA = (a.type === 'movie' ? a.media.title : a.media.name) || '';
          const titleB = (b.type === 'movie' ? b.media.title : b.media.name) || '';
          const result = titleA.localeCompare(titleB);
          return order === 'asc' ? result : -result;
        },
      },
    ],
    [t],
  );
  const bottomSheetActions = useMemo((): CollectionAction<PlaylistItemWithMedia>[] => {
    return [
      ...(canEditItem
        ? ([
            {
              icon: Icons.Delete,
              label: upperFirst(t('common.messages.delete')),
              variant: 'destructive',
              onPress: handleDeletePlaylistItem,
              position: 'bottom',
            },
          ] as const)
        : []),
      {
        icon: Icons.Comment,
        label: upperFirst(t('common.messages.view_comment', { count: 1 })),
        onPress: handlePlaylistItemComment,
        position: 'top',
      },
    ];
  }, [handleDeletePlaylistItem, handlePlaylistItemComment, t, canEditItem]);
  const swipeActions = useMemo(
    (): CollectionAction<PlaylistItemWithMedia>[] => [
      {
        icon: Icons.Comment,
        label: upperFirst(t('common.messages.comment', { count: 1 })),
        onPress: handlePlaylistItemComment,
        variant: 'accent-yellow',
        position: 'left',
      },
      ...(canEditItem
        ? ([
            {
              icon: Icons.Delete,
              label: upperFirst(t('common.messages.delete')),
              onPress: handleDeletePlaylistItem,
              variant: 'destructive',
              position: 'right',
            },
          ] as const)
        : []),
    ],
    [handlePlaylistItemComment, handleDeletePlaylistItem, t, canEditItem],
  );

  const onItemAction = useCallback(
    (data: PlaylistItemWithMedia) => {
      if (!bottomSheetActions?.length) return;
      const additionalItems = bottomSheetActions.map((action) => ({
        icon: action.icon,
        label: action.label,
        onPress: () => action.onPress(data),
        position: action.position,
      }));
      if (data.type === 'movie') {
        openSheet(BottomSheetMovie, {
          movie: data.media,
          additionalItemsTop: additionalItems.filter((action) => action.position === 'top'),
          additionalItemsBottom: additionalItems.filter((action) => action.position === 'bottom'),
        });
      } else if (data.type === 'tv_series') {
        openSheet(BottomSheetTvSeries, {
          tvSeries: data.media,
          additionalItemsTop: additionalItems.filter((action) => action.position === 'top'),
          additionalItemsBottom: additionalItems.filter((action) => action.position === 'bottom'),
        });
      }
    },
    [bottomSheetActions, openSheet],
  );

  // iOS: merged into CollectionScreen's own single native "…" menu (top row + bottom section).
  const menuTopItems = useMemo((): CollectionMenuItem[] => {
    if (!playlist) return [];
    return [
      ...(user && user.id !== playlist.userId
        ? [
            {
              type: 'action' as const,
              label: upperFirst(t('common.messages.like')),
              icon: {
                type: 'sfSymbol' as const,
                name: (isLiked ? 'heart.fill' : 'heart') as 'heart.fill' | 'heart',
              },
              keepsMenuPresented: true,
              onPress: toggleLike,
            },
            {
              type: 'action' as const,
              label: upperFirst(t('common.messages.save')),
              icon: {
                type: 'sfSymbol' as const,
                name: (isSaved ? 'bookmark.fill' : 'bookmark') as 'bookmark.fill' | 'bookmark',
              },
              keepsMenuPresented: true,
              onPress: toggleSaved,
            },
          ]
        : []),
      {
        type: 'action' as const,
        label: upperFirst(t('common.messages.share')),
        icon: { type: 'sfSymbol' as const, name: 'square.and.arrow.up' as const },
        onPress: () => openSheet(BottomSheetSharePlaylist, { playlist }),
      },
    ];
  }, [playlist, user, isLiked, isSaved, toggleLike, toggleSaved, openSheet, t]);

  const menuBottomItems = useMemo((): CollectionMenuItem[] => {
    if (!playlist) return [];
    return [
      ...(playlist.owner
        ? [
            {
              type: 'action' as const,
              label: upperFirst(t('common.messages.go_to_user')),
              icon: { type: 'sfSymbol' as const, name: 'person' as const },
              onPress: () =>
                router.push({
                  pathname: '/user/[username]',
                  params: { username: playlist.owner!.username },
                }),
            },
          ]
        : []),
      ...(canEditItem
        ? [
            {
              type: 'action' as const,
              label: upperFirst(t('common.messages.edit_order')),
              icon: { type: 'sfSymbol' as const, name: 'list.number' as const },
              onPress: () =>
                router.push({
                  pathname: '/playlist/[playlist_id]/sort',
                  params: { playlist_id: playlist.id },
                }),
            },
          ]
        : []),
      ...(canEditThisPlaylist
        ? [
            {
              type: 'action' as const,
              label: upperFirst(t('common.messages.manage_members', { gender: 'male', count: 2 })),
              icon: { type: 'sfSymbol' as const, name: 'person.2' as const },
              onPress: () =>
                router.push({
                  pathname: '/playlist/[playlist_id]/edit/members',
                  params: { playlist_id: playlist.id },
                }),
            },
            {
              type: 'action' as const,
              label: upperFirst(t('common.messages.edit_playlist')),
              icon: { type: 'sfSymbol' as const, name: 'gearshape' as const },
              onPress: () =>
                router.push({
                  pathname: '/playlist/[playlist_id]/edit',
                  params: { playlist_id: playlist.id },
                }),
            },
          ]
        : []),
      ...(playlist.role === 'owner'
        ? [
            {
              type: 'action' as const,
              label: upperFirst(t('common.messages.delete')),
              icon: { type: 'sfSymbol' as const, name: 'trash' as const },
              destructive: true,
              onPress: handleDeletePlaylist,
            },
          ]
        : []),
    ];
  }, [playlist, canEditItem, canEditThisPlaylist, router, t, handleDeletePlaylist]);

  return (
    <>
      <AnimatedStackScreen
        options={{
          headerTitle: playlist?.title ?? '',
          headerRight: () =>
            playlist ? (
              <View style={tw`flex-row items-center`}>
                <ButtonActionPlaylistLike playlist={playlist} />
                <ButtonActionPlaylistSaved playlist={playlist} />
                <Button
                  variant="ghost"
                  size="icon"
                  icon={Icons.EllipsisVertical}
                  onPress={() =>
                    openSheet(BottomSheetPlaylist, {
                      playlist: playlist,
                    })
                  }
                />
              </View>
            ) : null,
        }}
        scrollY={scrollY}
        triggerHeight={headerHeight}
      />
      <CollectionScreen
        // Query
        queryData={items}
        screenTitle={playlist?.title || ''}
        screenSubtitle={
          playlist?.owner ? (
            <View style={tw`items-center gap-1`}>
              <CardUser variant="inline" user={playlist.owner} />
              {playlist.description && <Text textColor="muted">{playlist.description}</Text>}
            </View>
          ) : (
            <CardUser variant="inline" skeleton />
          )
        }
        poster={playlist?.poster || undefined}
        posterType={'playlist'}
        emptyStateMessage={t('help_hints.playlists.items.empty')}
        // Search
        // Native header search bar on iOS is wired inside CollectionScreen itself.
        searchPlaceholder={upperFirst(t('pages.playlist.search.placeholder'))}
        // Header (iOS: merged into CollectionScreen's own single native "…" menu, since only
        // one unstable_headerRightItems can be active per screen — top row: like/save/share,
        // bottom section: go to playlist / owner / manage members / edit / delete)
        additionalHeaderRightItemsTop={menuTopItems}
        additionalHeaderRightItemsBottom={menuBottomItems}
        fuseKeys={[
          {
            name: 'title',
            getFn: (item) => (item.type === 'movie' ? item.media.title : item.media.name) || '',
          },
        ]}
        // Sort
        sortByOptions={sortByOptions}
        // Getters
        getItemId={(item) => item.id!}
        getItemTitle={(item) => (item.type === 'movie' ? item.media.title : item.media.name) || ''}
        getItemSubtitle={(item) => {
          if (item.type === 'movie') {
            return item.media.directors.map((director) => director.name).join(', ') || '';
          } else if (item.type === 'tv_series') {
            return item.media.createdBy?.map((creator) => creator.name).join(', ') || '';
          }
          return '';
        }}
        getItemImageUrl={(item) =>
          getTmdbImage({ path: item.media.posterPath, size: 'w342' }) || ''
        }
        getItemUrl={(item) => item.media.url || ''}
        getItemBackdropUrl={(item) =>
          getTmdbImage({ path: item.media.posterPath, size: 'w780' }) || ''
        }
        getCreatedAt={(item) => item.createdAt}
        // Actions
        bottomSheetActions={bottomSheetActions}
        swipeActions={swipeActions}
        onItemAction={onItemAction}
        // Button
        additionalToolbarItems={
          canEditItem && playlist
            ? [
                {
                  label: upperFirst(t('common.messages.edit_order')),
                  icon: Icons.ListOrdered,
                  sfSymbolName: 'list.number',
                  onPress: () =>
                    router.push({
                      pathname: '/playlist/[playlist_id]/sort',
                      params: {
                        playlist_id: playlist.id,
                      },
                    }),
                },
              ]
            : undefined
        }
        // SharedValues
        scrollY={scrollY}
        headerHeight={headerHeight}
        // View
        defaultView={view}
        onViewChange={setPlaylistView}
      />
    </>
  );
};

export default PlaylistScreen;
