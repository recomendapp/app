import tw from "apps/mobile/src/lib/tw";
import { useWindowDimensions, View } from "react-native";
import { clamp, upperFirst } from "lodash";
import { useTranslations } from "use-intl";
import { Text } from "apps/mobile/src/components/ui/text";
import { MultiRowHorizontalList } from "apps/mobile/src/components/ui/MultiRowHorizontalList";
import { GAP, PADDING_HORIZONTAL } from "apps/mobile/src/theme/globals";
import { useMemo } from "react";
import { CardPerson } from "apps/mobile/src/components/cards/CardPerson";
import { useQuery } from "@tanstack/react-query";
import { movieCastingOptions } from "@libs/query-client";

interface MovieWidgetCastProps extends React.ComponentPropsWithoutRef<typeof View> {
	movieId: number;
}

const MovieWidgetCast = ({
	movieId,
	style,
} : MovieWidgetCastProps) => {
	const t = useTranslations();
	const { width: screenWidth } = useWindowDimensions();
	const width = useMemo(() => clamp((screenWidth * 0.8) - ((PADDING_HORIZONTAL * 2) + GAP * 2), 400), [screenWidth]);

	const {
		data,
	} = useQuery(movieCastingOptions({
		movieId,
	}));

	if (!data?.length) return null;

	return (
		<View> 
			<Text style={[tw`text-sm font-medium`, { marginHorizontal: PADDING_HORIZONTAL }]}>
				{`${upperFirst(t('common.messages.starring'))} :`}
			</Text>
			<MultiRowHorizontalList
			data={data}
			renderItem={(item) => (
				<CardPerson variant='list' person={item.person} style={tw`h-12`} />
			)}
			keyExtractor={(item) => item.personId.toString()}
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
			/>
		</View>
	)
};

export default MovieWidgetCast;
