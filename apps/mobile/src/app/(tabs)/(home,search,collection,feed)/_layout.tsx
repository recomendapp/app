import { useAuth } from 'apps/mobile/src/providers/AuthProvider';
import { useNotifications } from 'apps/mobile/src/providers/NotificationsProvider';
import { ThemeUpdater, useTheme } from 'apps/mobile/src/providers/ThemeProvider';
import { Stack } from 'expo-router';
import { upperFirst } from 'lodash';
import { useMemo } from 'react';
import { useTranslations } from 'use-intl';

const AppLayout = ({ segment } : { segment: string }) => {
  const { defaultScreenOptions } = useTheme();
  const t = useTranslations();
  const { user } = useAuth();
  const { isMounted } = useNotifications();
  const initialRouteName = useMemo(() => {
    switch (segment) {
      case '(search)':
        return 'search';
      case '(feed)':
        return 'feed';
      case '(collection)':
        return 'collection/(tabs)';
      default:
        return 'index';
    }
  }, [segment]);

  return (
  <>
    <ThemeUpdater />
    <Stack
    initialRouteName={initialRouteName}
    screenOptions={defaultScreenOptions}
    >
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="feed" options={{ headerTitle: upperFirst(t('common.messages.feed')) }} />
      </Stack.Protected>
      {/* COLLECTION */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="collection/(tabs)" />
        <Stack.Screen name="collection/bookmarks" options={{ headerTitle: upperFirst(t('common.messages.for_later')) }} />
        <Stack.Screen name="collection/my-recos" options={{ headerTitle: upperFirst(t('common.messages.my_recos')) }} />
      </Stack.Protected>
      {/* MOVIES */}
      <Stack.Screen name="film/[film_id]/review/[review_id]/index" options={{ headerTitle: upperFirst(t('common.messages.review', { count: 1 })) }} />
      <Stack.Screen name="film/[film_id]/details" options={{ headerTitle: upperFirst(t('common.messages.detail', { count: 2 })) }} />
      <Stack.Screen name="film/[film_id]/reviews" options={{ headerTitle: upperFirst(t('common.messages.review', { count: 2 })) }} />
      <Stack.Screen name="film/[film_id]/playlists" options={{ headerTitle: upperFirst(t('common.messages.playlist', { count: 2 })) }} />
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="film/[film_id]/review/create" options={{ headerTitle: upperFirst(t('common.messages.new_review')) }} />
        <Stack.Screen name="film/[film_id]/review/[review_id]/edit" options={{ headerTitle: upperFirst(t('common.messages.edit_review')) }} />
      </Stack.Protected>
      {/* TV SERIES */}
      <Stack.Screen name="tv-series/[tv_series_id]/review/[review_id]/index" options={{ headerTitle: upperFirst(t('common.messages.review', { count: 1 })) }} />
      <Stack.Screen name="tv-series/[tv_series_id]/details" options={{ headerTitle: upperFirst(t('common.messages.detail', { count: 2 })) }} />
      <Stack.Screen name="tv-series/[tv_series_id]/reviews" options={{ headerTitle: upperFirst(t('common.messages.review', { count: 2 })) }} />
      <Stack.Screen name="tv-series/[tv_series_id]/playlists" options={{ headerTitle: upperFirst(t('common.messages.playlist', { count: 2 })) }} />
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="tv-series/[tv_series_id]/review/create" options={{ headerTitle: upperFirst(t('common.messages.new_review')) }} />
        <Stack.Screen name="tv-series/[tv_series_id]/review/[review_id]/edit" options={{ headerTitle: upperFirst(t('common.messages.edit_review')) }} />
      </Stack.Protected>

      {/* NOTIFICATIONS */}
      <Stack.Protected guard={!!isMounted}>
        <Stack.Screen name="notifications" options={{ headerTitle: upperFirst(t('common.messages.notification', { count: 2 })) }} />
			  <Stack.Screen name="follow-requests" options={{ headerTitle: upperFirst(t('common.messages.follow_requests')) }} />
      </Stack.Protected>
    </Stack>
  </>
  );
};

export default AppLayout;