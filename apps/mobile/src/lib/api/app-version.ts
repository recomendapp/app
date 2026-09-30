import { Platform } from 'react-native';
import * as Application from 'expo-application';
import type { QueryClient } from '@tanstack/react-query';
import { systemControllerGetStatusOptions } from '@libs/api-js';
import { APP_PLATFORM_HEADER, APP_VERSION_HEADER } from '@libs/rules';
import { BUNDLE_IDENTIFIER } from '../../env';

// apps/mobile/eas.json -> submit.production.ios.ascAppId. Not derivable at
// runtime (unlike the Android package name), so kept as a constant.
const IOS_APP_STORE_ID = '6749225891';

export const MOBILE_APP_STORE_URL = (Platform.select({
  ios: `itms-apps://apps.apple.com/app/id${IOS_APP_STORE_ID}`,
  android: `market://details?id=${BUNDLE_IDENTIFIER}`,
}) ?? null) as string | null;

/**
 * Sent on every API request by `lib/api/init.ts`, so `AppVersionMiddleware`
 * can 426 any of them once this version drops below the configured minimum.
 *
 * N.B. this is the marketing/semver version (package.json `version`, CFBundleShortVersionString
 * on iOS), not `RELEASE_VERSION` from `env/common.ts` which is the *build* number.
 */
export const MOBILE_APP_HEADERS = {
  [APP_PLATFORM_HEADER]: Platform.OS === 'ios' ? 'ios' : 'android',
  [APP_VERSION_HEADER]: Application.nativeApplicationVersion ?? '',
} as const;

/**
 * `GET /system/status`: maintenance mode + this app's version status in one
 * round trip, since the app sends its headers on every request anyway.
 */
export const systemStatusQueryOptions = (): ReturnType<
  typeof systemControllerGetStatusOptions
> => ({
  ...systemControllerGetStatusOptions(),
  staleTime: 0,
  refetchOnWindowFocus: true,
});

type UpgradeRequiredErrorPayload = { code: 'UPGRADE_REQUIRED'; minVersion: string };

const isUpgradeRequiredError = (error: unknown): error is UpgradeRequiredErrorPayload =>
  !!error &&
  typeof error === 'object' &&
  (error as { code?: unknown }).code === 'UPGRADE_REQUIRED' &&
  typeof (error as { minVersion?: unknown }).minVersion === 'string';

/**
 * Any request can 426 mid-session (the middleware runs on every route). When
 * that happens, flip the cached version status immediately instead of waiting
 * for the next policy poll, so the force-update screen shows up right away.
 */
export const handleUpgradeRequiredError = (queryClient: QueryClient, error: unknown) => {
  if (!isUpgradeRequiredError(error)) return;

  queryClient.setQueryData(systemStatusQueryOptions().queryKey, (current) => ({
    isMaintenance: current?.isMaintenance ?? false,
    version: {
      status: 'update_required' as const,
      minVersion: error.minVersion,
      latestVersion: current?.version.latestVersion ?? null,
    },
  }));
};
