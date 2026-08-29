import { useCallback, useMemo, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchUsersInfiniteOptions, usersInfiniteOptions } from '@libs/query-client';
import { UserSummary } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/text';
import { View } from '../../components/ui/view';
import { Button } from '../../components/ui/Button';
import { CardUser } from '../../components/cards/CardUser';
import { FloatingFooter } from '../../components/ui/FloatingFooter';
import { Icons } from '../../constants/Icons';
import ButtonUserFollow from '../../components/buttons/ButtonUserFollow';
import useDebounce from '../../hooks/useDebounce';
import tw from '../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../theme/globals';
import { useTheme } from '../../providers/ThemeProvider';
import { KeyboardAwareLegendList } from '@legendapp/list/keyboard';
import { useHeaderHeight } from 'expo-router/react-navigation';

const WelcomeFollowScreen = () => {
  const t = useTranslations();
  const router = useRouter();
  const { mode, colors, isLiquidGlassAvailable } = useTheme();
  const navigationHeaderHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const query = useDebounce(search);
  const isSearching = query.length > 0;

  const popularResults = useInfiniteQuery({
    ...usersInfiniteOptions({ filters: { sort_by: 'followers_count', sort_order: 'desc' } }),
    enabled: !isSearching,
  });
  const searchResults = useInfiniteQuery({
    ...searchUsersInfiniteOptions({ filters: { q: query } }),
    enabled: isSearching,
  });

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = isSearching
    ? searchResults
    : popularResults;
  const users = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const renderItem = useCallback(
    ({ item }: { item: UserSummary }) => (
      <CardUser variant="list" user={item}>
        <ButtonUserFollow profileId={item.id} size="sm" />
      </CardUser>
    ),
    [],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          ...(isLiquidGlassAvailable
            ? {
                headerStyle: { backgroundColor: 'transparent' },
              }
            : {}),
          headerSearchBarOptions: {
            autoCapitalize: 'none',
            placeholder: upperFirst(t('common.messages.search_user', { count: 1 })),
            onChangeText: (e) => setSearch(e.nativeEvent.text),
            hideNavigationBar: false,
            allowToolbarIntegration: false,
            hideWhenScrolling: false,
            autoFocus: true,
          },
        }}
      />
      <KeyboardAwareLegendList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => <View style={tw`h-2`} />}
        contentContainerStyle={{
          gap: GAP,
          paddingTop: navigationHeaderHeight,
          paddingHorizontal: PADDING_HORIZONTAL,
          paddingBottom: insets.bottom + PADDING_VERTICAL,
        }}
        ListEmptyComponent={() =>
          isLoading ? (
            <Icons.Loader />
          ) : query.length > 0 ? (
            <Text textColor="muted" style={tw`text-center`}>
              {upperFirst(t('common.messages.no_results'))}
            </Text>
          ) : null
        }
        indicatorStyle={mode === 'dark' ? 'white' : 'black'}
        onEndReached={() => hasNextPage && fetchNextPage()}
        ListFooterComponent={
          isFetchingNextPage ? <Icons.Loader color={colors.mutedForeground} /> : null
        }
      />
      <FloatingFooter>
        <Button
          size="lg"
          containerStyle={tw`w-full`}
          onPress={() => router.push('/welcome/import')}
        >
          {upperFirst(t('common.messages.next'))}
        </Button>
      </FloatingFooter>
    </>
  );
};

export default WelcomeFollowScreen;
