import tw from "apps/mobile/src/lib/tw";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { CardUser } from "../cards/CardUser";
import { LegendList } from "@legendapp/list/react-native";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { Text } from "../ui/text";
import { GAP } from "apps/mobile/src/theme/globals";
import { useInfiniteQuery } from "@tanstack/react-query";
import { usersInfiniteOptions } from "@libs/query-client";

interface WidgetUserDiscoveryProps extends React.ComponentPropsWithoutRef<typeof View> {
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const WidgetUserDiscovery = ({
  style,
  labelStyle,
  containerStyle
} : WidgetUserDiscoveryProps) => {
  const t = useTranslations();
  const {
    data: users,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(usersInfiniteOptions());

  const flattenUsers = users?.pages.flatMap(page => page.data) || [];

  if (!flattenUsers.length) {
    return null;
  }

  return (
    <View style={[tw`gap-2`, style]}>
      <Text style={[tw`font-semibold text-xl`, labelStyle]}>
        {upperFirst(t('common.messages.discover_users'))}
      </Text>
      <LegendList
        data={flattenUsers}
        renderItem={({ item }) => (
          <View style={tw`max-h-24`}>
            <CardUser user={item} style={tw`h-full w-48`} />
          </View>
        )}
        snapToInterval={200}
        decelerationRate="fast"
        keyExtractor={(item) => item.id!.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.2}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        contentContainerStyle={containerStyle}
        nestedScrollEnabled
      />
    </View>
  );
};
WidgetUserDiscovery.displayName = 'WidgetUserDiscovery';
