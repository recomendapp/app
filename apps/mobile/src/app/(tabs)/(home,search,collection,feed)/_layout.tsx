import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { Stack } from 'expo-router';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';

export const unstable_settings = {
  // One anchor per segment of the shared route. The former value also branched on `user`,
  // which `Stack.Protected` below now decides on its own: an unauthenticated visitor never
  // gets `feed` or `collection/(tabs)` registered, so there is nothing to anchor to.
  anchor: 'index',
  search: { anchor: 'search' },
  collection: { anchor: 'collection/(tabs)' },
  feed: { anchor: 'feed' },
};

const AppLayout = ({ segment }: { segment: string }) => {
  const { defaultScreenOptions } = useTheme();
  const t = useTranslations();
  const { user } = useAuth();
  return (
    <Stack screenOptions={defaultScreenOptions}>
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
