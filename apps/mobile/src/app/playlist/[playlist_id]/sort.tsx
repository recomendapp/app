import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import tw from "apps/mobile/src/lib/tw";
import { View } from "apps/mobile/src/components/ui/view";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { playlistItemsAllOptions, playlistOptions, usePlaylistItemUpdateMutation } from "@libs/query-client";
import { useToast } from "apps/mobile/src/components/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import useHeaderHeight from "apps/mobile/src/hooks/useHeaderHeight";
import { canEditPlaylistItem, PlaylistItemWithMedia } from "@libs/api-js";
import DraggableFlatList, { DragEndParams, RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { ImageWithFallback } from "apps/mobile/src/components/utils/ImageWithFallback";
import { getMediaDetails } from "apps/mobile/src/components/utils/getMediaDetails";
import { getTmdbImage } from "apps/mobile/src/lib/tmdb/getTmdbImage";
import { Text } from "apps/mobile/src/components/ui/text";
import { Button } from "apps/mobile/src/components/ui/Button";
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";

const PlaylistSortScreen = () => {
	const toast = useToast();
	const insets = useSafeAreaInsets();
	const t = useTranslations();
	const router = useRouter();
	const { colors } = useTheme();
	const headerHeight = useHeaderHeight();
	const { playlist_id } = useLocalSearchParams();
	const playlistId = Number(playlist_id);
	const {
		data: playlist,
	} = useQuery(playlistOptions({
		playlistId: playlistId,
	}));
	const canEditItem = useMemo(() => playlist ? canEditPlaylistItem(playlist?.role) : undefined, [playlist]);
	const { data: playlistItemsRequest, isLoading: playlistItemsRequestIsLoading } = useQuery(playlistItemsAllOptions({
		playlistId: playlist?.id,
	}));

	const handleClose = useCallback(() => {
		router.back();
	}, [router]);

	const { mutateAsync: updateItem } = usePlaylistItemUpdateMutation();

	// States
	const [playlistItems, setPlaylistItems] = useState<PlaylistItemWithMedia[] | undefined>(undefined);
	const loading = useMemo(() => playlistItems === undefined || (playlistItemsRequest === undefined || playlistItemsRequestIsLoading), [playlistItems, playlistItemsRequest, playlistItemsRequestIsLoading]);
	
	// Handlers
	const handleSaveItem = useCallback(async ({ itemId, position }: { itemId: number; position: number }) => {
		await updateItem({
			path: {
				playlist_id: playlistId,
				item_id: itemId,
			},
			body: {
				position,
			}
		}, {
			onError: () => {
				toast.error(upperFirst(t('common.messages.an_error_occurred')));
			}
		});
	}, [playlistId, toast, t, updateItem]);
	const handleOnDragEnd = useCallback(({ from, to, data }: DragEndParams<PlaylistItemWithMedia>) => {
		if (from === to) return;
		const updatedItem = data.at(to);
		updatedItem && handleSaveItem({
			itemId: updatedItem.id,
			position: to + 1,
		});
	}, [handleSaveItem]);
	const handleQuickMove = useCallback((item: PlaylistItemWithMedia) => {

	}, []);

	// Render
	const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<PlaylistItemWithMedia>) => {
		const details = item.type === 'movie'
			? getMediaDetails({ type: 'movie', media: item.media })
			: getMediaDetails({ type: 'tv_series', media: item.media });
		return (
			<ScaleDecorator activeScale={1.05}>
				<View
				style={[
					tw`flex-row items-center justify-between gap-2 rounded-md my-0.5`,
				]}
				>
					<View style={tw`flex-row items-center gap-2 shrink`}>
						<ImageWithFallback
						alt={details.title || ''}
						source={{ uri: getTmdbImage({ path: details.imagePath, size: 'w185' }) || '' }}
						style={[{ aspectRatio: 2 / 3, height: 'fit-content' }, tw`rounded-md w-12`]}
						/>
						<View style={tw`shrink`}>
							<Text numberOfLines={1}>
								{details.title || ''}
							</Text>
							{(details.credits && details.credits.length > 0) ? (
								<Text style={[tw`text-xs`, { color: colors.mutedForeground }]} numberOfLines={1}>
									{details.credits.map((credit) => credit.name).join(', ')}
								</Text>
							) : null}
						</View>
					</View>
					<Button
					variant="ghost"
					icon={Icons.Menu}
					iconProps={{ color: colors.mutedForeground }}
					size="icon"
					onPress={() => handleQuickMove(item)}
					onLongPress={drag}
					disabled={isActive}
					/>
				</View>
			</ScaleDecorator>
		);
	}, [colors, handleQuickMove]);

	// useEffects
	useEffect(() => {
		if (playlistItemsRequest) {
			setPlaylistItems(playlistItemsRequest);
		}
	}, [playlistItemsRequest]);

	if (canEditItem === false) {
		return <Redirect href={'..'} />;
	}

	// Returns
	if (loading) {
		return (
			<View><Icons.Loader /></View>
		);
	}

	if (playlistItems?.length  === 0) {
		return (
			<View style={tw`flex-1 items-center justify-center p-4`}>
				<Text textColor='muted'>{upperFirst(t('common.messages.no_results'))}</Text>
			</View>
		);
	}
	return (
	<>
		<Stack.Screen
		options={{
			headerTitle: upperFirst(t('common.messages.edit_order')),
			unstable_headerLeftItems: (props) => [
				{
					type: "button",
					label: upperFirst(t('common.messages.close')),
					onPress: handleClose,
					icon: {
						name: "xmark",
						type: "sfSymbol",
					},
				},
			],
		}}
		/>
		{playlist ? (
			<DraggableFlatList
			data={playlistItems || []}
			onDragEnd={handleOnDragEnd}
			renderItem={renderItem}
			keyExtractor={(item) => item.id.toString()}
			contentContainerStyle={{
				paddingHorizontal: PADDING_HORIZONTAL,
				paddingBottom: PADDING_VERTICAL + insets.bottom,
				paddingTop: headerHeight,
			}}
			/>
		) : <View style={tw`flex-1 items-center justify-center p-4`}><Icons.Loader /></View>}
	</>
	)
};

export default PlaylistSortScreen;