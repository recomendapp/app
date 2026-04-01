import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import tw from "apps/mobile/src/lib/tw";
import { Link } from "expo-router";
import { StyleProp, TextStyle, View, ViewStyle } from "react-native";
import { useTheme } from "apps/mobile/src/providers/ThemeProvider";
import { Icons } from "apps/mobile/src/constants/Icons";
import { useTranslations } from "use-intl";
import { upperFirst } from "lodash";
import { CardMovie } from "../cards/CardMovie";
import { MediaMovie, MediaTvSeries, UserWatchlist } from "@recomendapp/types";
import { CardTvSeries } from "../cards/CardTvSeries";
import { GAP } from "apps/mobile/src/theme/globals";
import { GridView } from "../ui/GridView";
import { Text } from "../ui/text";
import { useUserWatchlistQuery } from "apps/mobile/src/api/users/userQueries";

interface WidgetUserWatchlistProps extends React.ComponentPropsWithoutRef<typeof View> {
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const WatchlistItem = ({ item }: { item: UserWatchlist }) => {
  if (item.type === 'movie') {
    return <CardMovie variant='list' hideReleaseDate hideDirectors movie={item.media as MediaMovie} />;
  }
  
  if (item.type === 'tv_series') {
    return <CardTvSeries variant='list' hideReleaseDate hideCreator tvSeries={item.media as MediaTvSeries} />;
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
    <Link href="/collection/watchlist" style={labelStyle}>
      <View style={tw`flex-row items-center`}>
        <Text style={tw`font-semibold text-xl`} numberOfLines={1}>
          {upperFirst(t('common.messages.to_watch'))}
        </Text>
        <Icons.ChevronRight color={colors.mutedForeground} />
      </View>
    </Link>
  );
};

export const WidgetUserWatchlist = ({
  style,
  labelStyle,
  containerStyle,
}: WidgetUserWatchlistProps) => {
  const { session } = useAuth();
  const { data: watchlist } = useUserWatchlistQuery({
    userId: session?.user.id,
    filters: {
      sortBy: 'created_at',
      sortOrder: 'random',
      limit: 6,
    }
  });

  if (!watchlist?.length) {
    return null;
  }

  return (
    <View style={[{ gap: GAP }, style]}>
      <WidgetHeader labelStyle={labelStyle} />
      <View style={containerStyle}>
        <GridView
        data={watchlist}
        renderItem={(item) => (
          <WatchlistItem item={item} />
        )}
        />
      </View>
    </View>
  );
};
WidgetUserWatchlist.displayName = 'WidgetUserWatchlist';
