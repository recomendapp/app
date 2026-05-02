// Sentry
import '../logger/sentry/setup';
import * as Sentry from '@sentry/react-native';
// API
import '../lib/api/init';

import { useRef, useState } from 'react';
import { setAndroidNavigationBar } from '../lib/android-navigation-bar';
import { Providers } from '../providers/Providers';
import StatusBar from '../components/StatusBar';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { Stack } from 'expo-router';
import { enableFreeze, enableScreens } from 'react-native-screens';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Platform } from 'react-native';
import { osName } from 'expo-device';

export { ErrorBoundary } from '../providers/ErrorBoundaryProvider';

enableScreens(true);
enableFreeze(true);

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const RootLayoutNav = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { defaultScreenOptions, isLiquidGlassAvailable } = useTheme();
  return (
    <Stack initialRouteName="(tabs)" screenOptions={defaultScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* PLAYLISTS */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="playlist/[playlist_id]/edit"
          options={{
            headerShown: false,
            presentation: 'modal',
            headerTransparent: false,
            ...(isLiquidGlassAvailable
              ? {
                  contentStyle: { backgroundColor: 'transparent' },
                  headerStyle: { backgroundColor: 'transparent' },
                }
              : {}),
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="playlist/[playlist_id]/sort"
          options={{
            title: upperFirst(t('common.messages.edit_order')),
            presentation:
              Platform.OS === 'ios'
                ? isLiquidGlassAvailable && osName !== 'iPadOS'
                  ? 'formSheet'
                  : 'modal'
                : 'modal',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.8],
            sheetInitialDetentIndex: 0,
            headerTransparent: true,
            ...(isLiquidGlassAvailable
              ? {
                  contentStyle: { backgroundColor: 'transparent' },
                  headerStyle: { backgroundColor: 'transparent' },
                }
              : {}),
          }}
        />
        <Stack.Screen
          name="playlist/add/[type]/[id]"
          options={{
            title: upperFirst(t('common.messages.add_to_playlist')),
            presentation:
              Platform.OS === 'ios'
                ? isLiquidGlassAvailable && osName !== 'iPadOS'
                  ? 'formSheet'
                  : 'modal'
                : 'modal',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.8],
            sheetInitialDetentIndex: 0,
            headerTransparent: false,
            ...(isLiquidGlassAvailable
              ? {
                  contentStyle: { backgroundColor: 'transparent' },
                  headerStyle: { backgroundColor: 'transparent' },
                }
              : {}),
          }}
        />
      </Stack.Protected>
      {/* MOVIES */}
      <Stack.Screen
        name="film/[film_id]/watched-dates"
        options={{ title: upperFirst(t('common.messages.watched_dates')), presentation: 'modal' }}
      />
      {/* RECOS */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="reco/send/[type]/[id]"
          options={{
            title: upperFirst(t('common.messages.send_to_friend')),
            presentation:
              Platform.OS === 'ios'
                ? isLiquidGlassAvailable && osName !== 'iPadOS'
                  ? 'formSheet'
                  : 'modal'
                : 'modal',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.8],
            sheetInitialDetentIndex: 0,
            headerTransparent: false,
            ...(isLiquidGlassAvailable
              ? {
                  contentStyle: { backgroundColor: 'transparent' },
                  headerStyle: { backgroundColor: 'transparent' },
                }
              : {}),
          }}
        />
      </Stack.Protected>
      {/* AUTH */}
      <Stack.Protected guard={!user}>
        <Stack.Screen
          name="auth/(main)"
          options={{
            headerShown: false,
            presentation: Platform.select({
              ios: 'modal',
              android: 'formSheet',
              default: 'modal',
            }),
          }}
        />
        <Stack.Screen
          name="auth/(password)"
          options={{
            title: t('common.messages.forgot_password'),
            headerShown: false,
            presentation: Platform.select({
              ios: 'modal',
              android: 'formSheet',
              default: 'modal',
            }),
          }}
        />
      </Stack.Protected>
      {/* NOTIFICATIONS */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="notifications"
          options={{
            title: upperFirst(t('common.messages.notification', { count: 2 })),
            presentation: Platform.select({
              android: 'formSheet',
              default: 'modal',
            }),
          }}
        />
      </Stack.Protected>
      {/* FOLLOW REQUESTS */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="follow-requests"
          options={{
            title: upperFirst(t('common.messages.follow_requests')),
            presentation: Platform.select({
              android: 'formSheet',
              default: 'modal',
            }),
          }}
        />
      </Stack.Protected>
      {/* SETTINGS */}
      <Stack.Screen
        name="settings/index"
        options={{ headerTitle: upperFirst(t('pages.settings.label')) }}
      />
      <Stack.Screen
        name="settings/appearance"
        options={{ headerTitle: upperFirst(t('pages.settings.appearance.label')) }}
      />
      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="settings/profile"
          options={{ headerTitle: upperFirst(t('pages.settings.profile.label')) }}
        />
        <Stack.Screen
          name="settings/account"
          options={{ headerTitle: upperFirst(t('pages.settings.account.label')) }}
        />
        <Stack.Screen
          name="settings/subscription"
          options={{ headerTitle: upperFirst(t('pages.settings.subscription.label')) }}
        />
        <Stack.Screen
          name="settings/security"
          options={{ headerTitle: upperFirst(t('pages.settings.security.label')) }}
        />
        <Stack.Screen
          name="settings/notifications"
          options={{ headerTitle: upperFirst(t('pages.settings.notifications.label')) }}
        />
      </Stack.Protected>
      {/* ABOUT */}
      <Stack.Screen
        name="about/index"
        options={{ headerTitle: upperFirst(t('common.messages.about')) }}
      />

      <Stack.Screen
        name="explore"
        options={{
          title: upperFirst(t('common.messages.explore')),
          headerTitle: () => <></>,
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="upgrade" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, animation: 'slide_from_bottom', animationDuration: 250 }}
      />
    </Stack>
  );
};

const RootLayout = () => {
  const hasMounted = useRef(false);
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

  // Set the Android navigation bar color
  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }
    setAndroidNavigationBar('dark');
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <Providers>
      <StatusBar />
      <RootLayoutNav />
    </Providers>
  );
};

export default Sentry.wrap(RootLayout);
