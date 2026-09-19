import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import Color from 'color';
import { userBookmarksAllOptions, userRecosAllOptions } from '@libs/query-client';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import {
  clearHomeWidgets,
  syncBookmarksWidget,
  syncRecosWidget,
} from '../lib/widgets/syncHomeWidgets';

/**
 * Keeps the iOS home screen widgets (Watchlist, Recos) in sync with the
 * user's data. The widget runtime cannot fetch or run async work on its own
 * (see expo-widgets docs), so the app pushes snapshots whenever the
 * underlying queries change and again whenever the app is foregrounded.
 */
export const useHomeWidgetsSync = () => {
  const { user } = useAuth();
  const t = useTranslations();
  const { colors } = useTheme();
  const wasSignedIn = useRef(false);
  const bookmarksLabel = upperFirst(t('common.messages.for_later'));
  const recosLabel = upperFirst(t('common.messages.my_recos', { count: 2 }));
  // The widget's Swift runtime doesn't parse the app's HSL color strings reliably, so
  // resolve to hex here, same as `useCollectionStaticRoutes` does for these icons.
  const bookmarksAccentColor = Color(colors.accentBlue).hex();
  const recosAccentColor = Color(colors.accentYellow).hex();

  const { data: bookmarks, dataUpdatedAt: bookmarksUpdatedAt } = useQuery({
    ...userBookmarksAllOptions({ userId: user?.id }),
    enabled: Platform.OS === 'ios' && !!user,
  });
  const { data: recos, dataUpdatedAt: recosUpdatedAt } = useQuery({
    ...userRecosAllOptions({ userId: user?.id }),
    enabled: Platform.OS === 'ios' && !!user,
  });

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (!user) {
      if (wasSignedIn.current) clearHomeWidgets();
      wasSignedIn.current = false;
      return;
    }
    wasSignedIn.current = true;
    if (bookmarks) void syncBookmarksWidget(bookmarks, bookmarksLabel, bookmarksAccentColor);
  }, [user, bookmarks, bookmarksUpdatedAt, bookmarksLabel, bookmarksAccentColor]);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !user || !recos) return;
    void syncRecosWidget(recos, recosLabel, recosAccentColor);
  }, [user, recos, recosUpdatedAt, recosLabel, recosAccentColor]);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !user) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (bookmarks) void syncBookmarksWidget(bookmarks, bookmarksLabel, bookmarksAccentColor);
      if (recos) void syncRecosWidget(recos, recosLabel, recosAccentColor);
    });
    return () => subscription.remove();
  }, [user, bookmarks, recos, bookmarksLabel, recosLabel, bookmarksAccentColor, recosAccentColor]);
};
