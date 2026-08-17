import { CardUser } from '../../../../../../components/cards/CardUser';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../../theme/globals';
import { LegendList } from '@legendapp/list/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { userByUsernameOptions, userFollowersInfiniteOptions } from '@libs/query-client';
import { UserSummary } from '@libs/api-js';
import { RefreshableStateContainer } from '../../../../../../components/ui/RefreshableStateContainer';
import { CardError } from '../../../../../../components/cards/CardError';
import { Icons } from '../../../../../../constants/Icons';
import { CardEmpty } from '../../../../../../components/cards/CardEmpty';
import { useTranslations } from 'use-intl';

const ProfileFollowersScreen = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { data: profile } = useQuery(userByUsernameOptions({ username: username }));
  const insets = useSafeAreaInsets();
  const t = useTranslations();
  const { data, hasNextPage, fetchNextPage, refetch, isLoading, isError, isRefetching } =
    useInfiniteQuery(
      userFollowersInfiniteOptions({
        profileId: profile?.id,
      }),
    );
  const followers = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);
  const renderItem = useCallback(
    ({ item }: { item: UserSummary }) => <CardUser variant="list" user={item} />,
    [],
  );
  if (isLoading) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: insets.bottom + PADDING_VERTICAL }}
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
        contentContainerStyle={{ paddingBottom: insets.bottom + PADDING_VERTICAL }}
      >
        <CardError />
      </RefreshableStateContainer>
    );
  }

  if (followers.length === 0) {
    return (
      <RefreshableStateContainer
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={{ paddingBottom: insets.bottom + PADDING_VERTICAL }}
      >
        <CardEmpty icon={'👥'} label={t('common.messages.no_followers')} />
      </RefreshableStateContainer>
    );
  }
  return (
    <LegendList
      data={followers}
      renderItem={renderItem}
      contentContainerStyle={{
        paddingLeft: insets.left + PADDING_HORIZONTAL,
        paddingRight: insets.right + PADDING_HORIZONTAL,
        paddingBottom: insets.bottom + PADDING_VERTICAL,
      }}
      scrollIndicatorInsets={{
        bottom: insets.bottom,
      }}
      keyExtractor={(item) => item.id}
      onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
      onRefresh={refetch}
    />
  );
};

export default ProfileFollowersScreen;
