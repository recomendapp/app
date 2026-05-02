import { CardUser } from '../components/cards/CardUser';
import { Button } from '../components/ui/Button';
import { Text } from '../components/ui/text';
import { View } from '../components/ui/view';
import { Icons } from '../constants/Icons';
import tw from '../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../theme/globals';
import { LegendList } from '@legendapp/list/react-native';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { useToast } from '../components/Toast';
import { useCallback, useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  userFollowRequestsInfiniteOptions,
  useUserAcceptFollowMutation,
  useUserDeclineFollowMutation,
} from '@libs/query-client';
import { useAuth } from '../providers/AuthProvider';
import { FollowRequest } from '@libs/api-js';
import { useModalHeaderOptions } from '../hooks/useModalHeaderOptions';
import { Stack } from 'expo-router';

const FollowRequestsScreen = () => {
  const t = useTranslations();
  const toast = useToast();
  const { user } = useAuth();
  const modalHeaderOptions = useModalHeaderOptions({
    forceCross: true,
  });
  const { bottomOffset, tabBarHeight } = useTheme();
  const { data, isLoading, isRefetching, refetch, hasNextPage, fetchNextPage } = useInfiniteQuery(
    userFollowRequestsInfiniteOptions({
      userId: user?.id,
    }),
  );
  const requests = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);
  const loading = requests === undefined || isLoading;

  // Mutations
  const { mutateAsync: acceptRequest } = useUserAcceptFollowMutation();
  const { mutateAsync: declineRequest } = useUserDeclineFollowMutation();

  // Handlers
  const handleAcceptRequest = useCallback(
    async (userId: string) => {
      await acceptRequest(
        {
          path: {
            user_id: userId,
          },
        },
        {
          onSuccess: () => {
            toast.success(upperFirst(t('common.messages.request_accepted', { count: 1 })));
          },
          onError: () => {
            toast.error(upperFirst(t('common.messages.error')), {
              description: upperFirst(t('common.messages.an_error_occurred')),
            });
          },
        },
      );
    },
    [acceptRequest, toast, t],
  );
  const handleDeclineRequest = useCallback(
    async (userId: string) => {
      await declineRequest(
        {
          path: {
            user_id: userId,
          },
        },
        {
          onSuccess: () => {
            toast.success(upperFirst(t('common.messages.request_declined', { count: 1 })));
          },
          onError: () => {
            toast.error(upperFirst(t('common.messages.error')), {
              description: upperFirst(t('common.messages.an_error_occurred')),
            });
          },
        },
      );
    },
    [declineRequest, toast, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: FollowRequest }) => (
      <CardUser user={item.user} style={tw`bg-transparent border-0 p-0 h-auto`}>
        <View style={tw`flex-row items-center justify-between gap-2`}>
          <Button
            icon={Icons.Check}
            size="fit"
            variant="accent-blue"
            onPress={() => handleAcceptRequest(item.user.id)}
            style={tw`py-1 px-2`}
          >
            {upperFirst(t('common.messages.accept'))}
          </Button>
          <Button
            icon={Icons.X}
            size="fit"
            variant="outline"
            onPress={() => handleDeclineRequest(item.user.id)}
            style={tw`py-1 px-2`}
          >
            {upperFirst(t('common.messages.decline'))}
          </Button>
        </View>
      </CardUser>
    ),
    [handleAcceptRequest, handleDeclineRequest, t],
  );

  return (
    <>
      <Stack.Screen options={modalHeaderOptions} />
      <LegendList
        data={requests || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.user.id}
        refreshing={isRefetching}
        onRefresh={refetch}
        onEndReached={() => hasNextPage && fetchNextPage()}
        ListEmptyComponent={
          loading ? (
            <Icons.Loader />
          ) : (
            <View>
              <Text textColor="muted" style={tw`text-center`}>
                {upperFirst(t('common.messages.no_follow_requests'))}
              </Text>
            </View>
          )
        }
        contentContainerStyle={[
          {
            gap: GAP,
            paddingHorizontal: PADDING_HORIZONTAL,
            paddingTop: PADDING_VERTICAL,
            paddingBottom: bottomOffset + PADDING_VERTICAL,
            flexGrow: 1,
          },
        ]}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
      />
    </>
  );
};

export default FollowRequestsScreen;
