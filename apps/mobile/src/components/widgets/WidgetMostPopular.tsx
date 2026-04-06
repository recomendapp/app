import tw from "apps/mobile/src/lib/tw";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { LegendList } from "@legendapp/list";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { CardMovie } from "../cards/CardMovie";
import { CardTvSeries } from "../cards/CardTvSeries";
import { GAP, WIDTH_CARD_XS } from "apps/mobile/src/theme/globals";
import { Text } from "../ui/text";
import { useInfiniteQuery } from "@tanstack/react-query";
import { widgetMediasMostPopularInfiniteOptions } from "@libs/query-client";
import { useCallback, useMemo } from "react";
import { ListInfiniteMediasMostPopular } from "@packages/api-js";

interface WidgetMostPopularProps extends React.ComponentPropsWithoutRef<typeof View> {
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const WidgetMostPopular = ({
  style,
  labelStyle,
  containerStyle,
}: WidgetMostPopularProps) => {
  const t = useTranslations();

  // Queries
  const {
    data,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(widgetMediasMostPopularInfiniteOptions());
  const medias = useMemo(() => data?.pages.flatMap(page => page.data) || [], [data]);

  const renderItem = useCallback(({ item }: { item: ListInfiniteMediasMostPopular['data'][number] }) => {
    if (item.type === 'movie') {
      return <CardMovie variant="poster" movie={item.media} style={{ width: WIDTH_CARD_XS }} />
    }
    if (item.type === 'tv_series') {
      return <CardTvSeries variant="poster" tvSeries={item.media} style={{ width: WIDTH_CARD_XS }} />
    }
    return null;
  }, []);

  if (!medias.length) {
    return null;
  }

  return (
    <View style={[tw`flex-1 gap-2`, style]}>
      <Text style={[tw`font-semibold text-xl`, labelStyle]}>
        {upperFirst(t('common.messages.most_popular', { count: 2 }))}
      </Text>
      <LegendList
        data={medias}
        renderItem={renderItem}
        snapToInterval={WIDTH_CARD_XS + GAP}
        decelerationRate="fast"
        keyExtractor={(item) =>  `${item.type}-${item.mediaId}`}
        onEndReached={() => hasNextPage && fetchNextPage()}
        horizontal
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        contentContainerStyle={containerStyle}
        nestedScrollEnabled
      />
    </View>
  );
};
WidgetMostPopular.displayName = 'WidgetMostPopular';
