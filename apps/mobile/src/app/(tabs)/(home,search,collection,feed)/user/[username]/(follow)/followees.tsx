import { CardUser } from '../../../../../../components/cards/CardUser';
import { useTheme } from '../../../../../../providers/ThemeProvider';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../../theme/globals';
import { LegendList } from '@legendapp/list/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { userByUsernameOptions, userFollowingInfiniteOptions } from '@libs/query-client';
import { UserSummary } from '@libs/api-js';
import { RefreshableStateContainer } from 'apps/mobile/src/components/ui/RefreshableStateContainer';
import { Icons } from 'apps/mobile/src/constants/Icons';
import { CardError } from 'apps/mobile/src/components/cards/CardError';
import { CardEmpty } from 'apps/mobile/src/components/cards/CardEmpty';
import { useTranslations } from 'use-intl';

const ProfileFolloweesScreen = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { data: profile } = useQuery(userByUsernameOptions({ username: username }));
  const insets = useSafeAreaInsets();
  const t = useTranslations();
  const { bottomOffset, tabBarHeight } = useTheme();
  const { data, hasNextPage, fetchNextPage, refetch, isLoading, isError, isRefetching } =
    useInfiniteQuery(
      userFollowingInfiniteOptions({
        profileId: profile?.id,
      }),
    );
  const followees = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const renderItem = useCallback(
    ({ item }: { item: UserSummary }) => <CardUser variant="list" user={item} />,
    [],
  );
  if (isLoading) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: bottomOffset + PADDING_VERTICAL }}
      >
        <Icons.Loader />
      </RefreshableStateContainer>
    );
  }

  if (isError) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: bottomOffset + PADDING_VERTICAL }}
      >
        <CardError />
      </RefreshableStateContainer>
    );
  }

  if (followees.length === 0) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: bottomOffset + PADDING_VERTICAL }}
      >
        <CardEmpty icon={'👥'} label={t('common.messages.no_followees')} />
      </RefreshableStateContainer>
    );
  }
  return (
    <LegendList
      data={followees}
      renderItem={renderItem}
      contentContainerStyle={{
        paddingLeft: insets.left + PADDING_HORIZONTAL,
        paddingRight: insets.right + PADDING_HORIZONTAL,
        paddingBottom: bottomOffset + PADDING_VERTICAL,
      }}
      scrollIndicatorInsets={{
        bottom: tabBarHeight,
      }}
      keyExtractor={(item) => item.id}
      onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
      onRefresh={refetch}
    />
  );
};

export default ProfileFolloweesScreen;
