import { CardPlaylist } from "apps/mobile/src/components/cards/CardPlaylist";
import useCollectionStaticRoutes, { CollectionStaticRoute } from "apps/mobile/src/components/collection/useCollectionStaticRoutes";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import tw from "apps/mobile/src/lib/tw";
import { Link } from "expo-router";
import { useWindowDimensions, View } from "react-native";
import { LegendList } from "@legendapp/list";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { Text } from "apps/mobile/src/components/ui/text";
import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userPlaylistsInfiniteOptions } from "@libs/query-client";
import { Playlist } from "@packages/api-js";

const CollectionScreen = () => {
	const { user } = useAuth();
	const { width: SCREEN_WIDTH } = useWindowDimensions();
	const { bottomOffset, tabBarHeight } = useTheme();
	const staticRoutes = useCollectionStaticRoutes();
	const {
		data: playlists,
		fetchNextPage,
		refetch,
		hasNextPage,
	} = useInfiniteQuery(userPlaylistsInfiniteOptions({
		userId: user?.id,
		filters: {
			sort_by: 'updated_at',
			sort_order: 'desc',
		}
	}));

	const combinedItems = useMemo((): (
		| { type: 'static'; data: CollectionStaticRoute }
		| { type: 'playlist'; data: Playlist }
	)[] => [
		...staticRoutes.map(route => ({ 
			type: 'static' as const,
			data: route 
		})),
		...(playlists ? playlists.pages.flatMap(page => 
			page.data.map(playlist => ({ 
				type: 'playlist' as const,
				data: playlist 
			}))
		) : []),
	], [staticRoutes, playlists]);

	const renderItem = useCallback(({ item } : { item: typeof combinedItems[number] }) => {
		if (item.type === 'static') {
			return (
				<Link href={item.data.href} style={tw`p-1`}>
					{item.data.icon}
					<View style={tw`w-full items-center`}>
						<Text>{item.data.label}</Text>
					</View>
				</Link>
			);
		} else if (item.type === 'playlist') {
			return (
				<View style={tw`p-1`}>
					<CardPlaylist playlist={item.data} style={tw`w-full`} showItemsCount />
				</View>
			);
		}
		return null;
	}, []);

	return (
		<LegendList
		data={combinedItems}
		renderItem={renderItem}
		onRefresh={refetch}
		numColumns={
			SCREEN_WIDTH < 360 ? 2 :
			SCREEN_WIDTH < 414 ? 3 :
			SCREEN_WIDTH < 600 ? 4 :
			SCREEN_WIDTH < 768 ? 5 : 6
		}
		contentContainerStyle={{
			paddingHorizontal: PADDING_HORIZONTAL,
			paddingBottom: bottomOffset + PADDING_VERTICAL,
		}}
		scrollIndicatorInsets={{ bottom: tabBarHeight }}
		keyExtractor={(item) => (
			item.type === 'static' ? `static-${item.data.label}` : item.data.id.toString()
		)}
		maintainVisibleContentPosition={false}
		onEndReached={() => hasNextPage && fetchNextPage()}
		onEndReachedThreshold={0.3}
		nestedScrollEnabled
		/>
	)
};

export default CollectionScreen;