import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import tw from "apps/mobile/src/lib/tw";
import { Link } from "expo-router";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { CardMovie } from "../cards/CardMovie";
import { CardTvSeries } from "../cards/CardTvSeries";
import { GAP } from "apps/mobile/src/theme/globals";
import { GridView } from "../ui/GridView";
import { Text } from "../ui/text";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userBookmarksInfiniteOptions } from "@libs/query-client";
import { BookmarkWithMedia } from "@packages/api-js";

interface WidgetUserBookmarksProps extends React.ComponentPropsWithoutRef<typeof View> {
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const WatchlistItem = ({ item }: { item: BookmarkWithMedia }) => {
  if (item.type === 'movie') {
    return <CardMovie variant='list' hideReleaseDate hideDirectors movie={item.media} />;
  }
  
  if (item.type === 'tv_series') {
    return <CardTvSeries variant='list' hideReleaseDate hideCreator tvSeries={item.media} />;
  }
  
  return null;
};
WatchlistItem.displayName = 'WatchlistItem';

const WidgetHeader = ({ 
  labelStyle 
}: { 
  labelStyle?: StyleProp<TextStyle>; 
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  return (
    <Link href="/collection/bookmarks" style={labelStyle}>
      <View style={tw`flex-row items-center`}>
        <Text style={tw`font-semibold text-xl`} numberOfLines={1}>
          {upperFirst(t('common.messages.to_watch'))}
        </Text>
        <Icons.ChevronRight color={colors.mutedForeground} />
      </View>
    </Link>
  );
};

const MAX_ITEMS = 6;

export const WidgetUserBookmarks = ({
  style,
  labelStyle,
  containerStyle,
}: WidgetUserBookmarksProps) => {
  const { user } = useAuth();
  const { data: watchlist } = useInfiniteQuery(userBookmarksInfiniteOptions({
    userId: user?.id,
    filters: {
      sort_by: 'random',
    }
  }));
  const flattendWatchlist = (watchlist?.pages.flatMap(page => page.data) || []).slice(0, MAX_ITEMS);

  if (!flattendWatchlist.length) {
    return null;
  }

  return (
    <View style={[{ gap: GAP }, style]}>
      <WidgetHeader labelStyle={labelStyle} />
      <View style={containerStyle}>
        <GridView
        data={flattendWatchlist}
        renderItem={(item) => (
          <WatchlistItem item={item} />
        )}
        />
      </View>
    </View>
  );
};
WidgetUserBookmarks.displayName = 'WidgetUserBookmarks';
