import tw from "apps/mobile/src/lib/tw";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { upperFirst } from "lodash";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { CardTvSeriesSeason } from "apps/mobile/src/components/cards/CardTvSeriesSeason";
import { useTranslations } from "use-intl";
import { Text } from "apps/mobile/src/components/ui/text";
import { TvSeries } from "@libs/api-js";
import { useQuery } from "@tanstack/react-query";
import { tvSeriesSeasonsOptions } from "@libs/query-client";

interface TvSeriesWidgetSeasonsProps extends React.ComponentPropsWithoutRef<typeof View> {
	tvSeries: TvSeries;
	labelStyle?: StyleProp<TextStyle>;
	containerStyle?: StyleProp<ViewStyle>;
}

const TvSeriesWidgetSeasons = ({
	tvSeries,
	style,
	labelStyle,
	containerStyle,
} : TvSeriesWidgetSeasonsProps) => {
	const { colors } = useTheme();
	const t = useTranslations();

	const {
		data
	} = useQuery(tvSeriesSeasonsOptions({
		tvSeriesId: tvSeries.id,
	}));

	if (!data?.length) return null;

	return (
	<View style={[tw`gap-1`, style]}>
		<Text style={[tw`font-medium text-lg`, labelStyle]}>
			{upperFirst(t('common.messages.tv_season', { count: data.length }))}
			<Text style={[{ color: colors.mutedForeground }, tw`font-medium text-sm`]}>
				{` ${data.length}`}
			</Text>
		</Text>
		<LegendList
		data={data}
		renderItem={({ item }) => (
			<CardTvSeriesSeason key={item.id} season={item} style={tw`w-32`} />
		)}
		snapToInterval={136}
		decelerationRate="fast"
		keyExtractor={(item) => item.id!.toString()}
		horizontal
		showsHorizontalScrollIndicator={false}
		ItemSeparatorComponent={() => <View style={tw`w-2`} />}
		contentContainerStyle={containerStyle}
		nestedScrollEnabled
		/>
	</View>
	);
};

export default TvSeriesWidgetSeasons;
