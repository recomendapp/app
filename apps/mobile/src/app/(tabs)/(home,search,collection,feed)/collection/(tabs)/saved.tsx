import { CardPlaylist } from "apps/mobile/src/components/cards/CardPlaylist";
import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import tw from "apps/mobile/src/lib/tw";
import { Text, useWindowDimensions, View } from "react-native";
import { LegendList } from "@legendapp/list";
import { Icons } from "apps/mobile/src/constants/Icons";
import { upperFirst } from "lodash";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { useTranslations } from "use-intl";
import { useCallback, useMemo } from "react";
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userPlaylistsSavedInfiniteOptions } from "@libs/query-client";
import { PlaylistWithOwner } from "@packages/api-js";

const CollectionSavedScreen = () => {
	const { user } = useAuth();
	const t = useTranslations();
	const { width: SCREEN_WIDTH } = useWindowDimensions();
	const { colors, bottomOffset, tabBarHeight } = useTheme();
	const {
		data,
		isLoading,
		fetchNextPage,
		refetch,
		hasNextPage,
	} = useInfiniteQuery(userPlaylistsSavedInfiniteOptions({
		userId: user?.id,
	}));
	const loading = isLoading || data === undefined;
	const playlists = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);

	const renderItem = useCallback(({ item: { owner, ...playlist } }: { item: PlaylistWithOwner }) => (
		<View style={tw`p-1`}>
			<CardPlaylist playlist={playlist} owner={owner} style={tw`w-full`} />
		</View>
	), []);
	return (
		<LegendList
		data={playlists}
		renderItem={renderItem}
		ListEmptyComponent={
			loading ? <Icons.Loader /> : (
				<View style={tw`flex-1 items-center justify-center p-4`}>
					<Text style={[tw`text-center`, { color: colors.mutedForeground }]}>
						{upperFirst(t('common.messages.no_playlists_saved'))}
					</Text>
				</View>
			)
		}
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
		maintainVisibleContentPosition={false}
		scrollIndicatorInsets={{ bottom: tabBarHeight }}
		keyExtractor={(item) => item.id.toString()}
		onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
		onEndReachedThreshold={0.3}
		nestedScrollEnabled
		/>
	)
};

export default CollectionSavedScreen;