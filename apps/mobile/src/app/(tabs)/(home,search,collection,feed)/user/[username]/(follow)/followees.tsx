import { CardUser } from "apps/mobile/src/components/cards/CardUser";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from "apps/mobile/src/theme/globals";
import { LegendList } from "@legendapp/list";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { userByUsernameOptions, userFollowingInfiniteOptions } from "@libs/query-client";
import { UserSummary } from "@packages/api-js";

const ProfileFolloweesScreen = () => {
	const { username } = useLocalSearchParams<{ username: string }>();
	const { data: profile } = useQuery(userByUsernameOptions({ username: username }));
	const insets = useSafeAreaInsets();
	const { bottomOffset, tabBarHeight } = useTheme();
	const {
		data,
		hasNextPage,
		fetchNextPage,
		refetch,
	} = useInfiniteQuery(userFollowingInfiniteOptions({
		profileId: profile?.id,
	}));
	const followees = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);
	const renderItem = useCallback(({ item }: { item: UserSummary }) => (
		<CardUser variant="list" user={item} />
	), []);
	return (
		<LegendList
		data={followees}
		renderItem={renderItem}
		contentContainerStyle={{
			paddingLeft: insets.left + PADDING_HORIZONTAL,
			paddingRight: insets.right + PADDING_HORIZONTAL,
			paddingBottom: bottomOffset + PADDING_VERTICAL,
		}}
		scrollIndicatorInsets={{
			bottom: tabBarHeight,
		}}
		keyExtractor={(item) => item.id}
		onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
		onRefresh={refetch}
		/>
	);
};

export default ProfileFolloweesScreen;