import { CardPlaylist } from "apps/mobile/src/components/cards/CardPlaylist";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import tw from "apps/mobile/src/lib/tw";
import { StyleProp, useWindowDimensions, View, ViewStyle } from "react-native";
import { LegendList, LegendListRef } from "@legendapp/list/react-native";
import { useCallback, useMemo, useRef } from "react";
import { useScrollToTop } from "@react-navigation/native";
import { GAP, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { Icons } from "apps/mobile/src/constants/Icons";
import { Text } from "apps/mobile/src/components/ui/text";
import { upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { useInfiniteQuery } from "@tanstack/react-query";
import { playlistFeaturedInfiniteOptions } from "@libs/query-client";
import { PlaylistWithOwner } from "@libs/api-js";

interface FeaturedPlaylistsProps {
	contentContainerStyle?: StyleProp<ViewStyle>;
}

const FeaturedPlaylists = ({
	contentContainerStyle,
} : FeaturedPlaylistsProps) => {
	const t = useTranslations();
	const { width: SCREEN_WIDTH } = useWindowDimensions();
	const { colors, bottomOffset, tabBarHeight } = useTheme();
	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
		refetch,
	} = useInfiniteQuery(playlistFeaturedInfiniteOptions());
	const playlists = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);
	// REFs
	const scrollRef = useRef<LegendListRef>(null);

	// Callbacks
	const renderItem = useCallback(({ item: { owner, ...playlist } }: { item: PlaylistWithOwner }) => (
		<CardPlaylist playlist={playlist} owner={owner} />
	), []);

	useScrollToTop(scrollRef);

	return (
		<LegendList
		ref={scrollRef}
		data={playlists}
		renderItem={renderItem}
		numColumns={
			SCREEN_WIDTH < 360 ? 2 :
			SCREEN_WIDTH < 414 ? 3 :
			SCREEN_WIDTH < 600 ? 4 :
			SCREEN_WIDTH < 768 ? 5 : 6
		}
		onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
		onEndReachedThreshold={0.3}
		contentContainerStyle={[
			{
				gap: GAP,
				paddingBottom: bottomOffset + PADDING_VERTICAL,
			},
			contentContainerStyle,
		]}
		scrollIndicatorInsets={{
			bottom: tabBarHeight,
		}}
		ListEmptyComponent={
			isLoading ? <Icons.Loader />
			: (
				<View style={tw`flex-1 items-center justify-center p-4`}>
					<Text style={[tw`text-center`, { color: colors.mutedForeground }]}>
						{upperFirst(t('common.messages.no_results'))}
					</Text>
				</View>
			)
		}
		keyExtractor={(item) => item.id.toString()}
		ItemSeparatorComponent={() => <View style={tw`h-2`} />}
		onRefresh={refetch}
		keyboardShouldPersistTaps='always'
		/>
	)
};
FeaturedPlaylists.displayName = 'FeaturedPlaylists';

export default FeaturedPlaylists;