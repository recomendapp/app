import { CardMovie } from "apps/mobile/src/components/cards/CardMovie";
import { Text } from "apps/mobile/src/components/ui/text";
import { Icons } from "apps/mobile/src/constants/Icons";
import tw from "apps/mobile/src/lib/tw";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { LegendList } from "@legendapp/list/react-native";
import { Link } from "expo-router";
import { upperFirst } from "lodash";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { useTranslations } from "use-intl";
import { Profile } from "@libs/api-js";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userMovieLogsInfiniteOptions } from "@libs/query-client";
import { useMemo } from "react";

interface ProfileWidgetLogMovieProps extends React.ComponentPropsWithoutRef<typeof View> {
	profile: Profile;
	labelStyle?: StyleProp<TextStyle>;
	containerStyle?: StyleProp<ViewStyle>;
}

const ProfileWidgetLogMovie = ({
	profile,
	style,
	labelStyle,
	containerStyle
} : ProfileWidgetLogMovieProps) => {
	const t = useTranslations();
	const { colors } = useTheme();
	const {
	  data,
	  fetchNextPage,
	  isFetching,
	  hasNextPage,
	} = useInfiniteQuery(userMovieLogsInfiniteOptions({
	  userId: profile?.id,
	  filters: {
		sort_by: 'updated_at',
		sort_order: 'desc',
	  }
	}));
	const activities = useMemo(() => data?.pages.flatMap(page => page.data) || [], [data]);

	if (!activities.length) return null;
  
	return (
	  <View style={[tw`gap-2`, style]}>
		<Link
		href={`/user/${profile.username!}/films`}
		style={labelStyle}
		>
			<View style={tw`flex-row items-center`}>
				<Text style={tw`font-semibold text-xl`} numberOfLines={1}>
				{upperFirst(t('common.messages.film', { count: 2 }))}
				</Text>
				<Icons.ChevronRight color={colors.mutedForeground} />
			</View>
		</Link>
		<LegendList
		data={activities}
		renderItem={({ item: { movie, ...log } }) => (
			<CardMovie
			variant='poster'
			movie={movie}
			profile={{
				log: log,
				user: profile,
			}}
			style={tw`w-32`}
			/>
		)}
		snapToInterval={136}
		decelerationRate="fast"
		keyExtractor={(item) => item.id.toString()}
		refreshing={isFetching}
		onEndReached={() => hasNextPage && fetchNextPage()}
		onEndReachedThreshold={0.25}
		horizontal
		showsHorizontalScrollIndicator={false}
		ItemSeparatorComponent={() => <View style={tw.style('w-2')} />}
		contentContainerStyle={containerStyle}
		/>
	  </View>
	);
};

export default ProfileWidgetLogMovie;