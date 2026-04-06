import tw from "apps/mobile/src/lib/tw";
import { useWindowDimensions, View } from "react-native";
import { clamp, upperFirst } from "lodash";
import { Href, Link } from "expo-router";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useTranslations } from "use-intl";
import { Text } from "apps/mobile/src/components/ui/text";
import { CardMovie } from "apps/mobile/src/components/cards/CardMovie";
import { MultiRowHorizontalList } from "apps/mobile/src/components/ui/MultiRowHorizontalList";
import { GAP, PADDING_HORIZONTAL } from "apps/mobile/src/theme/globals";
import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { personMoviesInfiniteOptions } from "@libs/query-client";
import { PersonMovie } from "@packages/api-js";

interface PersonWidgetFilmsProps extends React.ComponentPropsWithoutRef<typeof View> {
	personId: number;
	url: Href;
}

const PersonWidgetFilms = ({
	personId,
	url,
	style,
} : PersonWidgetFilmsProps) => {
	const { colors } = useTheme();
	const t = useTranslations();
	const { width: screenWidth } = useWindowDimensions();
	const width = useMemo(() => clamp(screenWidth - ((PADDING_HORIZONTAL * 2) + GAP * 2), 400), [screenWidth]);
	const {
		data,
		isLoading,
		fetchNextPage,
		hasNextPage,
	} = useInfiniteQuery(personMoviesInfiniteOptions({
		personId,
	}));
	const movies = useMemo(() => data?.pages.flatMap(page => page.data) || [], [data]);
	const loading = data === undefined || isLoading;
	return (
	<View style={[tw`gap-1`, style]}>
		<Link href={url} style={{ paddingHorizontal: PADDING_HORIZONTAL }}>
			<View style={tw`flex-row items-center`}>
				<Text style={tw`font-medium text-lg`} numberOfLines={1}>
					{upperFirst(t('common.messages.film', { count: 2 }))}
				</Text>
				<Icons.ChevronRight color={colors.mutedForeground} />
			</View>
		</Link>
		<MultiRowHorizontalList<PersonMovie>
		key={loading ? 'loading' : 'movie'}
		data={loading ? new Array(3).fill(null) : movies}
		renderItem={(item) => (
			<CardMovie
			variant="list"
			{...(!loading ? {
				movie: item.movie,
			} : {
				skeleton: true,
			})}
			/>
		)}
		ListEmptyComponent={
			<Text style={[tw``, { color: colors.mutedForeground }]}>
				{upperFirst(t('common.messages.no_films'))}
			</Text>
		}
		keyExtractor={(item, index) => loading ? index.toString() : item.movie.id.toString()}
		contentContainerStyle={{
			paddingHorizontal: PADDING_HORIZONTAL,
			gap: GAP,
		}}
		columnStyle={{
			width: width,
			gap: GAP,
		}}
		snapToInterval={width + GAP}
		decelerationRate={"fast"}
		onEndReached={() => hasNextPage && fetchNextPage()}
		onEndReachedThreshold={0.5}
		/>
	</View>
	);
};

export default PersonWidgetFilms;
