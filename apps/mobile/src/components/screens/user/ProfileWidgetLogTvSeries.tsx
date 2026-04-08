import { CardTvSeries } from "apps/mobile/src/components/cards/CardTvSeries";
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
import { userTvSeriesLogsInfiniteOptions } from "@libs/query-client";
import { useMemo } from "react";

interface ProfileWidgetLogTvSeriesProps extends React.ComponentPropsWithoutRef<typeof View> {
	profile: Profile;
	labelStyle?: StyleProp<TextStyle>;
	containerStyle?: StyleProp<ViewStyle>;
}

const ProfileWidgetLogTvSeries = ({
	profile,
	style,
	labelStyle,
	containerStyle
} : ProfileWidgetLogTvSeriesProps) => {
	const t = useTranslations();
	const { colors } = useTheme();
	const {
	  data,
	  fetchNextPage,
	  isFetching,
	  hasNextPage,
	} = useInfiniteQuery(userTvSeriesLogsInfiniteOptions({
	  userId: profile?.id ?? undefined,
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
		href={`/user/${profile.username!}/tv-series`}
		style={labelStyle}
		>
			<View style={tw`flex-row items-center`}>
				<Text style={tw`font-semibold text-xl`} numberOfLines={1}>
				{upperFirst(t('common.messages.tv_series', { count: 2 }))}
				</Text>
				<Icons.ChevronRight color={colors.mutedForeground} />
			</View>
		</Link>
		<LegendList
		data={activities}
		renderItem={({ item: { tvSeries, ...log } }) => (
			<CardTvSeries
			variant='poster'
			tvSeries={tvSeries}
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

export default ProfileWidgetLogTvSeries;