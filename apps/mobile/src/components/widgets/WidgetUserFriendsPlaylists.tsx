import tw from "apps/mobile/src/lib/tw";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { CardPlaylist } from "../cards/CardPlaylist";
import { LegendList } from "@legendapp/list/react-native";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { Text } from "../ui/text";
import { GAP } from "apps/mobile/src/theme/globals";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userPlaylistsFollowingInfiniteOptions } from "@libs/query-client";
import { useAuth } from "../../providers/AuthProvider";

interface WidgetUserFriendsPlaylistsProps extends React.ComponentPropsWithoutRef<typeof View> {
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const WidgetUserFriendsPlaylists = ({
  style,
  labelStyle,
  containerStyle,
}: WidgetUserFriendsPlaylistsProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { data: playlists, hasNextPage, fetchNextPage } = useInfiniteQuery(userPlaylistsFollowingInfiniteOptions({
    userId: user?.id
  }));
  const flattenPlaylists = playlists?.pages.flatMap(page => page.data) || [];

  if (!flattenPlaylists.length) {
    return null;
  }

  return (
    <View style={[tw`flex-1 gap-2`, style]}>
      <Text style={[tw`font-semibold text-xl`, labelStyle]}>
        {upperFirst(t('common.messages.friends_playlists'))}
      </Text>
      <LegendList
        data={flattenPlaylists}
        renderItem={({ item: { owner, ...playlist } }) => (
          <CardPlaylist playlist={playlist} owner={owner} style={tw`w-36`} />
        )}
        snapToInterval={152}
        decelerationRate="fast"
        keyExtractor={(item) => item.id.toString()}
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
WidgetUserFriendsPlaylists.displayName = 'WidgetUserFriendsPlaylists';
