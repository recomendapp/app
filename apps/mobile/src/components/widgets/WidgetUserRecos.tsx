import { useAuth } from "apps/mobile/src/providers/AuthProvider";
import tw from "apps/mobile/src/lib/tw";
import { Link } from "expo-router";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { View } from "apps/mobile/src/components/ui/view";
import UserAvatar from "apps/mobile/src/components/user/UserAvatar";
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
import { userRecosInfiniteOptions } from "@libs/query-client";
import { RecoWithMedia } from "@libs/api-js";

interface WidgetUserRecosProps extends React.ComponentPropsWithoutRef<typeof View> {
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const SendersAvatars = ({ 
  senders, 
  sendersShow = 3 
}: { 
  senders: RecoWithMedia['senders']; 
  sendersShow?: number; 
}) => {
  const { colors } = useTheme();

  const visibleSenders = senders.slice(0, sendersShow) || [];

  const remainingCount = senders.length - sendersShow;

  return (
    <View style={tw`flex-row -gap-2 overflow-hidden`}>
      {visibleSenders.map(({ user: sender }) => (
        <UserAvatar
          key={sender.id}
          full_name={sender.name}
          avatar_url={sender.avatar}
          style={tw`w-4 h-4`}
        />
      ))}
      {remainingCount > 0 && (
        <View style={tw`h-4 flex items-center justify-center rounded-full`}>
          <Text style={[{ color: colors.mutedForeground }, tw`text-xs`]}>
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
};
SendersAvatars.displayName = 'SendersAvatars';

const RecoItem = ({ 
  item, 
  sendersShow 
}: { 
  item: RecoWithMedia; 
  sendersShow: number; 
}) => {

  if (item.type === 'movie') {
    return (
      <CardMovie variant='list' hideReleaseDate hideDirectors movie={item.media}>
        <SendersAvatars senders={item.senders} sendersShow={sendersShow} />
      </CardMovie>
    );
  }

  if (item.type === 'tv_series') {
    return (
      <CardTvSeries variant='list' hideReleaseDate hideCreator tvSeries={item.media}>
        <SendersAvatars senders={item.senders} sendersShow={sendersShow} />
      </CardTvSeries>
    );
  }

  return null;
};
RecoItem.displayName = 'RecoItem';

const WidgetHeader = ({ 
  labelStyle 
}: { 
  labelStyle?: StyleProp<TextStyle>; 
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  return (
    <Link href="/collection/my-recos" style={labelStyle}>
      <View style={tw`flex-row items-center`}>
        <Text style={tw`font-semibold text-xl`} numberOfLines={1}>
          {upperFirst(t('common.messages.reco_by_your_friends'))}
        </Text>
        <Icons.ChevronRight color={colors.mutedForeground} />
      </View>
    </Link>
  );
};
WidgetHeader.displayName = 'WidgetHeader';

const MAX_RECOS = 6;

export const WidgetUserRecos = ({
  style,
  labelStyle,
  containerStyle
}: WidgetUserRecosProps) => {
  const { user } = useAuth();
  const { data: recos } = useInfiniteQuery(userRecosInfiniteOptions({
    userId: user?.id,
    filters: {
      sort_by: 'random',
    }
  }));
  const flattendRecos = (recos?.pages.flatMap(page => page.data) || []).slice(0, MAX_RECOS);

  const sendersShow = 3;

  if (!flattendRecos.length) {
    return null;
  }

  return (
    <View style={[{ gap: GAP }, style]}>
      <WidgetHeader labelStyle={labelStyle} />
      <View style={containerStyle}>
        <GridView
        data={flattendRecos}
        renderItem={(item) => (
          <RecoItem item={item} sendersShow={sendersShow} />
        )}
        />
      </View>
    </View>
  );
};
WidgetUserRecos.displayName = 'WidgetUserRecos';
