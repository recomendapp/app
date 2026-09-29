export const APP_PLATFORM_HEADER = 'x-app-platform';
export const APP_VERSION_HEADER = 'x-app-version';

// `web` isn't enforced anywhere yet (the web app doesn't send these headers),
// but the schema/rules support it so a future web version gate is a client
// change only, not a data model one.
export const APP_PLATFORMS = ['ios', 'android', 'web'] as const;
export type AppPlatform = (typeof APP_PLATFORMS)[number];

export const APP_VERSION_RULES = {
  // String, not a RegExp literal: embedded as-is in the `version_policy`
  // table's CHECK constraints (see the `system` Drizzle schema), so this is
  // the one source of truth for both the DB and the app's own validation.
  VERSION_PATTERN: '^\\d+(\\.\\d+){0,2}$',
  POLICY_CACHE_TTL_SECONDS: 60,
};

const VERSION_REGEX = new RegExp(APP_VERSION_RULES.VERSION_PATTERN);

export type AppVersionStatus = 'up_to_date' | 'update_available' | 'update_required';

export type AppVersionPolicy = {
  minVersion: string | null;
  latestVersion: string | null;
};

const isValidVersion = (value: string | null | undefined): value is string =>
  !!value && VERSION_REGEX.test(value);

/**
 * Compares two dotted numeric versions (e.g. "1.9" vs "1.10.2"), unequal
 * segment counts treated as zero-padded. Returns -1, 0 or 1.
 */
export function compareAppVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

/**
 * Pure decision: given the app's reported version and the configured policy,
 * is it up to date, has an optional update, or must it update to keep working?
 * An unparseable client version or policy value never blocks the app.
 */
export function evaluateAppVersionStatus(
  version: string,
  policy: AppVersionPolicy,
): AppVersionStatus {
  if (!isValidVersion(version)) return 'up_to_date';

  const minVersion = isValidVersion(policy.minVersion) ? policy.minVersion : null;
  const latestVersion = isValidVersion(policy.latestVersion) ? policy.latestVersion : null;

  if (minVersion && compareAppVersions(version, minVersion) < 0) return 'update_required';
  if (latestVersion && compareAppVersions(version, latestVersion) < 0) return 'update_available';
  return 'up_to_date';
}

type AppVersionHeadersInput = Record<string, string | string[] | undefined>;

/** Reads and validates the app-identifying headers off a raw headers object. */
export function readAppVersionHeaders(
  headers: AppVersionHeadersInput,
): { platform: AppPlatform; version: string } | null {
  const single = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const platform = single(headers[APP_PLATFORM_HEADER]);
  const version = single(headers[APP_VERSION_HEADER]);

  if (!version || !APP_PLATFORMS.includes(platform as AppPlatform)) return null;
  return { platform: platform as AppPlatform, version };
}
