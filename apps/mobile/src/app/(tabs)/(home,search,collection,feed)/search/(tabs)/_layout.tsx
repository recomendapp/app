import { Href, Stack, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { SegmentedControl } from '../../../../../components/ui/SegmentedControl';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import useSearchStore, { SearchType } from '../../../../../stores/useSearchStore';
import Animated, { FadeInUp } from 'react-native-reanimated';

const Filter = (props: NativeStackHeaderProps) => {
  const { search, isFocused, type } = useSearchStore((state) => state);
  const t = useTranslations();
  const router = useRouter();
  const routes = useMemo(
    (): { type: SearchType; label: string; href: Href }[] => [
      {
        type: 'all',
        label: upperFirst(t('common.messages.all', { count: 1, gender: 'male' })),
        href: { pathname: '/search', params: { q: search } },
      },
      {
        type: 'movies',
        label: upperFirst(t('common.messages.film', { count: 2 })),
        href: { pathname: '/search/films', params: { q: search } },
      },
      {
        type: 'tv_series',
        label: upperFirst(t('common.messages.tv_series', { count: 2 })),
        href: { pathname: '/search/tv-series', params: { q: search } },
      },
      {
        type: 'persons',
        label: upperFirst(t('common.messages.person', { count: 2 })),
        href: { pathname: '/search/persons', params: { q: search } },
      },
      {
        type: 'playlists',
        label: upperFirst(t('common.messages.playlist', { count: 2 })),
        href: { pathname: '/search/playlists', params: { q: search } },
      },
      {
        type: 'users',
        label: upperFirst(t('common.messages.user', { count: 2 })),
        href: { pathname: '/search/users', params: { q: search } },
      },
    ],
    [t, search],
  );
  const selectedIndex = useMemo(() => {
    const index = routes.findIndex((route) => route.type === type);
    return Math.max(0, index);
  }, [routes, type]);
  if (!isFocused && !(search && search.trim().length > 0)) {
    return null;
  }
  return (
    <Animated.View
      entering={FadeInUp}
      style={{ paddingHorizontal: PADDING_HORIZONTAL, paddingBottom: PADDING_VERTICAL }}
    >
      <SegmentedControl
        values={routes.map((route) => route.label)}
        selectedIndex={selectedIndex}
        onChange={(event) => {
          const route = routes[event.nativeEvent.selectedSegmentIndex];
          router.replace(route.href);
        }}
      />
    </Animated.View>
  );
};

const SearchTabsLayout = () => {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: (props) => <Filter {...props} />,
        }}
      />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
};

export default SearchTabsLayout;
