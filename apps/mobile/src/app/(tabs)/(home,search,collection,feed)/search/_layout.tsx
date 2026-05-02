import useDebounce from '../../../../hooks/useDebounce';
import useSearchStore from '../../../../stores/useSearchStore';
import { Stack, usePathname, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';

const SearchLayout = () => {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { search, setSearch, setIsFocused, type, setType } = useSearchStore((state) => state);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const handleBlurOrCancel = useCallback(() => {
    setIsFocused(false);

    if ((!search || search.trim() === '') && type !== 'all') {
      setType('all');
      router.replace('/search');
    }
  }, [search, type, router, setIsFocused, setType]);

  useEffect(() => {
    switch (pathname) {
      case '/search/films':
        return setType('movies');
      case '/search/tv-series':
        return setType('tv_series');
      case '/search/persons':
        return setType('persons');
      case '/search/playlists':
        return setType('playlists');
      case '/search/users':
        return setType('users');
      case '/search':
        return setType('all');
      default:
        return;
    }
  }, [pathname]);

  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, search, setSearch]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: upperFirst(t('common.messages.search')),
          headerTransparent: false,
          headerSearchBarOptions: {
            autoCapitalize: 'none',
            placeholder:
              type === 'users'
                ? upperFirst(t('common.messages.search_user', { count: 1 }))
                : type === 'playlists'
                  ? upperFirst(t('common.messages.search_playlist', { count: 1 }))
                  : type === 'movies'
                    ? upperFirst(t('common.messages.search_film', { count: 1 }))
                    : type === 'tv_series'
                      ? upperFirst(t('common.messages.search_tv_series', { count: 1 }))
                      : type === 'persons'
                        ? upperFirst(t('common.messages.search_person', { count: 1 }))
                        : upperFirst(t('pages.search.placeholder')),
            onChangeText: (e) => setSearchQuery(e.nativeEvent.text),
            hideNavigationBar: true,
            hideWhenScrolling: false,
            allowToolbarIntegration: false,
            onFocus: () => setIsFocused(true),
            onBlur: handleBlurOrCancel,
          },
        }}
      />
      <Stack initialRouteName="(tabs)" />
    </>
  );
};

export default SearchLayout;
