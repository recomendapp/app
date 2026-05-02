import { CardPlaylist } from '../../cards/CardPlaylist';
import { Text } from '../../ui/text';
import { Icons } from '../../../constants/Icons';
import tw from '../../../lib/tw';
import { useTheme } from '../../../providers/ThemeProvider';
import { LegendList } from '@legendapp/list/react-native';
import { Link } from 'expo-router';
import { upperFirst } from 'lodash';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { useTranslations } from 'use-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userPlaylistsInfiniteOptions } from '@libs/query-client';
import { useMemo } from 'react';
import { Profile } from '@libs/api-js';

interface ProfileWidgetPlaylistsProps extends React.ComponentPropsWithoutRef<typeof View> {
  profile: Profile;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const ProfileWidgetPlaylists = ({
  profile,
  style,
  labelStyle,
  containerStyle,
}: ProfileWidgetPlaylistsProps) => {
  const t = useTranslations();
  const { colors } = useTheme();
  const { data, fetchNextPage, isFetching, hasNextPage } = useInfiniteQuery(
    userPlaylistsInfiniteOptions({
      userId: profile?.id ?? undefined,
      filters: {
        sort_by: 'updated_at',
        sort_order: 'desc',
      },
    }),
  );
  const playlists = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);

  if (!playlists.length) return null;

  return (
    <View style={[tw`gap-2`, style]}>
      <Link href={`/user/${profile.username}/playlists`} style={labelStyle}>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`font-semibold text-xl`} numberOfLines={1}>
            {upperFirst(t('common.messages.playlist', { count: 2 }))}
          </Text>
          <Icons.ChevronRight color={colors.mutedForeground} />
        </View>
      </Link>
      <LegendList
        data={playlists}
        renderItem={({ item }) => <CardPlaylist playlist={item} style={tw`w-32`} showItemsCount />}
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

export default ProfileWidgetPlaylists;
