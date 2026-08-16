import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { Stack } from 'expo-router';
import { upperFirst } from 'lodash';
import { useMemo } from 'react';
import { useTranslations } from 'use-intl';

const AppLayout = ({ segment }: { segment: string }) => {
  const { defaultScreenOptions } = useTheme();
  const t = useTranslations();
  const { user } = useAuth();
  const initialRouteName = useMemo(() => {
    switch (segment) {
      case '(search)':
        return 'search';
      case '(feed)':
        // 'feed' is only registered in the Stack when guard={!!user} passes (see below).
        return user ? 'feed' : 'index';
      case '(collection)':
        // 'collection/(tabs)' is only registered in the Stack when guard={!!user} passes (see below).
        return user ? 'collection/(tabs)' : 'index';
      default:
        return 'index';
    }
  }, [segment, user]);

  return (
    <Stack initialRouteName={initialRouteName} screenOptions={defaultScreenOptions}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="feed"
          options={{ headerTitle: upperFirst(t('common.messages.feed')) }}
        />
      </Stack.Protected>
      {/* COLLECTION */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="collection/(tabs)" />
        <Stack.Screen
          name="collection/bookmarks"
          options={{ headerTitle: upperFirst(t('common.messages.for_later')) }}
        />
        <Stack.Screen
          name="collection/my-recos"
          options={{ headerTitle: upperFirst(t('common.messages.my_recos')) }}
        />
      </Stack.Protected>
      {/* MOVIES */}
      <Stack.Screen
        name="film/[film_id]/details"
        options={{ headerTitle: upperFirst(t('common.messages.detail', { count: 2 })) }}
      />
      <Stack.Screen
        name="film/[film_id]/reviews"
        options={{ headerTitle: upperFirst(t('common.messages.review', { count: 2 })) }}
      />
      <Stack.Screen
        name="film/[film_id]/playlists"
        options={{ headerTitle: upperFirst(t('common.messages.playlist', { count: 2 })) }}
      />
      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="film/[film_id]/review"
          options={{ title: upperFirst(t('common.messages.new_review')) }}
        />
      </Stack.Protected>
      {/* TV SERIES */}
      <Stack.Screen
        name="tv-series/[tv_series_id]/details"
        options={{ headerTitle: upperFirst(t('common.messages.detail', { count: 2 })) }}
      />
      <Stack.Screen
        name="tv-series/[tv_series_id]/reviews"
        options={{ headerTitle: upperFirst(t('common.messages.review', { count: 2 })) }}
      />
      <Stack.Screen
        name="tv-series/[tv_series_id]/playlists"
        options={{ headerTitle: upperFirst(t('common.messages.playlist', { count: 2 })) }}
      />
      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="tv-series/[tv_series_id]/review"
          options={{ title: upperFirst(t('common.messages.new_review')) }}
        />
      </Stack.Protected>
    </Stack>
  );
};

export default AppLayout;
