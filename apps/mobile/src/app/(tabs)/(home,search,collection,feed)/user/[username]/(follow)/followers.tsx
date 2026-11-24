import { CardUser } from '../../../../../../components/cards/CardUser';
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
import { useTheme } from '../../../../../../providers/ThemeProvider';

const ProfileFollowersScreen = () => {
  const { theme } = useTheme();
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
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spaces.md }}
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
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spaces.md }}
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
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spaces.md }}
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
        paddingTop: theme.spaces.md,
        paddingLeft: insets.left + theme.spaces.horizontal,
        paddingRight: insets.right + theme.spaces.horizontal,
        paddingBottom: insets.bottom + theme.spaces.md,
      }}
      keyExtractor={(item) => item.id}
      onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
      onRefresh={refetch}
    />
  );
};

export default ProfileFollowersScreen;
