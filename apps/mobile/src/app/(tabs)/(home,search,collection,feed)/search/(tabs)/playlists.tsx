import { CardPlaylist } from '../../../../../components/cards/CardPlaylist';
import ErrorMessage from '../../../../../components/ErrorMessage';
import { Text } from '../../../../../components/ui/text';
import { Icons } from '../../../../../constants/Icons';
import tw from '../../../../../lib/tw';
import useSearchStore from '../../../../../stores/useSearchStore';
import { LegendList, LegendListRef } from '@legendapp/list/react-native';
import { useScrollToTop } from 'expo-router/react-navigation';
import { upperFirst } from 'lodash';
import { useMemo, useRef } from 'react';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchPlaylistsInfiniteOptions } from '@libs/query-client';
import { useTheme } from '../../../../../providers/ThemeProvider';

const SearchPlaylistsScreen = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isVisible: keyboardVisible, height: keyboardHeight } = useKeyboardState((state) => state);
  const t = useTranslations();
  const search = useSearchStore((state) => state.search);

  // Queries
  const { data, isLoading, isError, hasNextPage, fetchNextPage, refetch, isRefetching } =
    useInfiniteQuery(
      searchPlaylistsInfiniteOptions({
        filters: {
          q: search,
        },
      }),
    );
  const playlists = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  // REFs
  const scrollRef = useRef<LegendListRef>(null);

  useScrollToTop(scrollRef);

  return (
    <LegendList
      key={search}
      ref={scrollRef}
      data={playlists}
      renderItem={({ item: { owner, ...playlist } }) => (
        <CardPlaylist variant="list" playlist={playlist} owner={owner} />
      )}
      contentContainerStyle={{
        paddingLeft: insets.left + theme.spaces.horizontal,
        paddingRight: insets.right + theme.spaces.horizontal,
        paddingBottom: keyboardVisible
          ? keyboardHeight + theme.spaces.md
          : insets.bottom + theme.spaces.md,
        gap: theme.spaces.md,
      }}
      scrollIndicatorInsets={{
        bottom: keyboardVisible ? keyboardHeight - insets.bottom : insets.bottom,
      }}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        isError ? (
          <ErrorMessage />
        ) : isLoading ? (
          <Icons.Loader />
        ) : (
          <Text textColor="muted" style={tw`text-center`}>
            {search.length
              ? upperFirst(t('common.messages.no_results'))
              : upperFirst(t('common.messages.start_typing_to_search_playlists'))}
          </Text>
        )
      }
      keyboardShouldPersistTaps="handled"
      onRefresh={refetch}
      refreshing={isRefetching}
      onEndReached={() => hasNextPage && fetchNextPage()}
    />
  );
};

export default SearchPlaylistsScreen;
