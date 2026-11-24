import { useMemo } from 'react';
import type { Href } from 'expo-router';
import { useVersionPolicy } from '../providers/VersionPolicyProvider';
import type { Guard } from './types';

const ROUTE: Extract<Href, string> = '/update-required';

/**
 * Holds the app when the API no longer serves this build.
 *
 * `isNeeded` is a plain boolean, with no pending state: the version query
 * deliberately does not hold the launch, so an outdated build renders for a
 * moment and is then redirected once the verdict lands. See the reasoning on
 * `VersionPolicyProvider` before adding a wait here.
 */
export const useVersionGuard = (): Guard => {
  const { isUpdateRequired } = useVersionPolicy();

  return useMemo<Guard>(
    () => ({ id: 'version', isNeeded: isUpdateRequired, route: ROUTE }),
    [isUpdateRequired],
  );
};
