import { Icons } from "apps/mobile/src/constants/Icons";
import useBottomSheetStore from "apps/mobile/src/stores/useBottomSheetStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import BottomSheetPlaylist from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetPlaylist";
import { View } from "apps/mobile/src/components/ui/view";
import tw from "apps/mobile/src/lib/tw";
import { Button } from "apps/mobile/src/components/ui/Button";
import AnimatedStackScreen from "apps/mobile/src/components/ui/AnimatedStackScreen";
import { useSharedValue } from "react-native-reanimated";
import ButtonActionPlaylistLike from "apps/mobile/src/components/buttons/ButtonActionPlaylistLike";
import ButtonActionPlaylistSaved from "apps/mobile/src/components/buttons/ButtonActionPlaylistSaved";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import { playlistItemsAllOptions, playlistOptions, usePlaylistItemsDeleteMutation, usePlaylistItemUpdateMutation, usePlaylistRealtime, useUserPlaylistLike, useUserPlaylistSaved } from "@libs/query-client";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "apps/mobile/src/stores/useUIStore";
import { useToast } from "apps/mobile/src/components/Toast";
import { useCallback, useMemo } from "react";
import { canEditPlaylistItem, PlaylistItemWithMedia } from "@packages/api-js";
import { Alert } from "react-native";
import richTextToPlainString from "apps/mobile/src/utils/richTextToPlainString";
import { BottomSheetComment } from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetComment";
import { CardUser } from "apps/mobile/src/components/cards/CardUser";
import { Text } from "apps/mobile/src/components/ui/text";
import CollectionScreen, { CollectionAction, SortByOption } from "apps/mobile/src/components/collection/CollectionScreen";
import BottomSheetMovie from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetMovie";
import BottomSheetTvSeries from "apps/mobile/src/components/bottom-sheets/sheets/BottomSheetTvSeries";
import { getTmdbImage } from "apps/mobile/src/lib/tmdb/getTmdbImage";

const PlaylistScreen = () => {
	const t = useTranslations();
	const { user } = useAuth();
	const { colors, mode } = useTheme();
	const { playlist_id } = useLocalSearchParams();
	const view = useUIStore((state) => state.playlistView);
	const setPlaylistView = useUIStore((state) => state.setPlaylistView);
	const playlistId = Number(playlist_id) || undefined;
	const openSheet = useBottomSheetStore((state) => state.openSheet);
	const toast = useToast();
	const router = useRouter();
	// Queries
	const { data: playlist } = useQuery(playlistOptions({
		playlistId: playlistId,
	}));
	const items = useQuery(playlistItemsAllOptions({
		playlistId,
	}));
	const { isLiked, toggle: toggleLike } = useUserPlaylistLike({
		userId: user && playlist && user.id === playlist.userId ? undefined : user?.id,
		playlistId: playlist?.id,
	});
	const { isSaved, toggle: toggleSaved } = useUserPlaylistSaved({
		userId: user && playlist && user.id === playlist.userId ? undefined : user?.id,
		playlistId: playlist?.id,
	});
	usePlaylistRealtime({
		playlistId: playlist?.id,
		role: playlist?.role,
	});
	// Mutations
	const { mutateAsync: updateItem } = usePlaylistItemUpdateMutation();
	const { mutateAsync: deleteItem } = usePlaylistItemsDeleteMutation({
		userId: user?.id,
	});
	const canEditItem = useMemo(() => canEditPlaylistItem(playlist?.role || null), [playlist?.role]);

	// SharedValues
	const scrollY = useSharedValue(0);
	const headerHeight = useSharedValue(0);
	
	// Handlers
	const handleDeletePlaylistItem = useCallback((data: PlaylistItemWithMedia) => {
		const title = (data.type === 'movie' ? data.media.title : data.media.name) || upperFirst(t('common.messages.unknown'));
		Alert.alert(
			upperFirst(t('common.messages.are_u_sure')),
			upperFirst(richTextToPlainString(t.rich('pages.playlist.modal.delete_item_confirm.description', { title: title, important: (chunk) => `"${chunk}"` }))),
			[
				{
					text: upperFirst(t('common.messages.cancel')),
					style: 'cancel',
				},
				{
					text: upperFirst(t('common.messages.delete')),
					onPress: async () => {
						await deleteItem({
							path: {
								playlist_id: data.playlistId,
							},
							body: {
								itemIds: [data.id],
							}
						}, {
							onSuccess: () => {
								toast.success(upperFirst(t('common.messages.deleted', { count: 1, gender: 'male' })));
							},
							onError: () => {
								toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
							}
						});
					},
					style: 'destructive',
				}
			], {
				userInterfaceStyle: mode,
			}
		)
	}, [t, deleteItem, toast, mode]);
	const handlePlaylistItemComment = useCallback((data: PlaylistItemWithMedia) => {
		openSheet(BottomSheetComment, {
			comment: data.comment || '',
			isAllowedToEdit: canEditItem,
			onSave: async (newComment) => {
				await updateItem({
					path: {
						playlist_id: data.playlistId,
						item_id: data.id,
					},
					body: {
						comment: newComment?.replace(/\s+/g, ' ').trimStart() || null,
					}
				}, {
					onError: () => {
						toast.error(upperFirst(t('common.messages.error')), { description: upperFirst(t('common.messages.an_error_occurred')) });
					}
				})
			}
		});
	}, [openSheet, canEditItem, updateItem, toast, t]);

	const sortByOptions = useMemo((): SortByOption<PlaylistItemWithMedia>[] => ([
		{
			label: upperFirst(t('common.messages.custom_sort')),
			value: 'rank',
			defaultOrder: 'asc',
			sortFn: (a, b, order) => {
				const rankA = a.rank;
				const rankB = b.rank;
				return order === 'asc'
					? rankA.localeCompare(rankB) 
					: rankB.localeCompare(rankA);
			}
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
	]), [t]);
	const bottomSheetActions = useMemo((): CollectionAction<PlaylistItemWithMedia>[] => {
		return [
			...(canEditItem ? [{
				icon: Icons.Delete,
				label: upperFirst(t('common.messages.delete')),
				variant: 'destructive',
				onPress: handleDeletePlaylistItem,
				position: 'bottom',
			}] as const : []),
			{
				icon: Icons.Comment,
				label: upperFirst(t('common.messages.view_comment', { count: 1})),
				onPress: handlePlaylistItemComment,
				position: 'top',
			}
		];
	}, [handleDeletePlaylistItem, handlePlaylistItemComment, t, canEditItem]);
	const swipeActions = useMemo((): CollectionAction<PlaylistItemWithMedia>[] => [
		{
			icon: Icons.Comment,
			label: upperFirst(t('common.messages.comment', { count: 1 })),
			onPress: handlePlaylistItemComment,
			variant: 'accent-yellow',
			position: 'left',
		},
		...(canEditItem ? [{
			icon: Icons.Delete,
			label: upperFirst(t('common.messages.delete')),
			onPress: handleDeletePlaylistItem,
			variant: 'destructive',
			position: 'right',
		}] as const : []),
	], [handlePlaylistItemComment, handleDeletePlaylistItem, t, canEditItem]);

	const onItemAction = useCallback((data: PlaylistItemWithMedia) => {
		if (!bottomSheetActions?.length) return;
		const additionalItems = bottomSheetActions.map(action => ({
			icon: action.icon,
			label: action.label,
			onPress: () => action.onPress(data),
			position: action.position,
		}));
		if (data.type === 'movie') {
			openSheet(BottomSheetMovie, {
				movie: data.media,
				additionalItemsTop: additionalItems.filter(action => action.position === 'top'),
				additionalItemsBottom: additionalItems.filter(action => action.position === 'bottom'),
			})
		} else if (data.type === 'tv_series') {
			openSheet(BottomSheetTvSeries, {
				tvSeries: data.media,
				additionalItemsTop: additionalItems.filter(action => action.position === 'top'),
				additionalItemsBottom: additionalItems.filter(action => action.position === 'bottom'),
			})
		}
	}, [bottomSheetActions, openSheet]);

	return (
	<>
		<AnimatedStackScreen
		options={{
			headerTitle: playlist?.title ?? '',
			headerRight: playlist ? () => (
				<View style={tw`flex-row items-center`}>
					<ButtonActionPlaylistLike playlist={playlist} />
					<ButtonActionPlaylistSaved playlist={playlist} />
					<Button
					variant="ghost"
					size="icon"
					icon={Icons.EllipsisVertical}
					onPress={() => openSheet(BottomSheetPlaylist, {
						playlist: playlist
					})}
					/>
				</View>
			) : undefined,
			unstable_headerRightItems: (props) => [
				...(user && playlist && user.id !== playlist.userId ? [
					{
						type: "button",
						label: upperFirst(t('common.messages.like')),
						onPress: toggleLike,
						icon: {
							name: isLiked ? "heart.fill" : "heart",
							type: "sfSymbol",
						},
						tintColor: isLiked ? colors.accentPink : undefined,
					},
					{
						type: "button",
						label: upperFirst(t('common.messages.save')),
						onPress: toggleSaved,
						icon: {
							name: isSaved ? "bookmark.fill" : "bookmark",
							type: "sfSymbol",
						},
						tintColor: isSaved ? colors.foreground : undefined,
					},
				] as const : []),
				{
					type: "button",
					label: upperFirst(t('common.messages.menu')),
					onPress: () => {
						if (playlist) {
							openSheet(BottomSheetPlaylist, {
								playlist: playlist
							})
						}
					},
					icon: {
						name: "ellipsis",
						type: "sfSymbol",
					},
				},
			]
		}}
		scrollY={scrollY}
		triggerHeight={headerHeight}
		/>
		<CollectionScreen
		// Query
		queryData={items}
		screenTitle={playlist?.title || ''}
		screenSubtitle={playlist?.owner ? (
			<View style={tw`items-center gap-1`}>
				<CardUser variant="inline" user={playlist.owner} />
				{playlist.description && <Text textColor="muted">{playlist.description}</Text>}
			</View>
		) : <CardUser variant="inline" skeleton />}
		poster={playlist?.poster || undefined}
		posterType={"playlist"}
		// Search
		searchPlaceholder={upperFirst(t('pages.playlist.search.placeholder'))}
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
		getItemImageUrl={(item) => getTmdbImage({ path: item.media.posterPath, size: 'w342' }) || ''}
		getItemUrl={(item) => item.media.url || ''}
		getItemBackdropUrl={(item) => getTmdbImage({ path: item.media.posterPath, size: 'w780' }) || ''}
		getCreatedAt={(item) => item.createdAt}
		// Actions
		bottomSheetActions={bottomSheetActions}
		swipeActions={swipeActions}
		onItemAction={onItemAction}
		// Button
		additionalToolbarItems={canEditItem && playlist ? [
			{
				label: upperFirst(t('common.messages.edit_order')),
				icon: Icons.ListOrdered,
				onPress: () => router.push({
					pathname: '/playlist/[playlist_id]/sort',
					params: {
						playlist_id: playlist.id,
					}
				}),
			}
		] : undefined}
		// SharedValues
		scrollY={scrollY}
		headerHeight={headerHeight}
		// View
		defaultView={view}
		onViewChange={setPlaylistView}
		/>
	</>
	)
};

export default PlaylistScreen;