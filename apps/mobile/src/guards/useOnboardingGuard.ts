import { useMemo } from 'react';
import type { Href } from 'expo-router';
import { useUIStore } from '../stores/useUIStore';
import type { Guard } from './types';

const ROUTE: Extract<Href, string> = '/onboarding';

/**
 * Holds a first launch behind the tour.
 *
 * The flag is local, so the verdict is known before the first render and the
 * tour is the first thing drawn rather than something pushed over the app.
 */
export const useOnboardingGuard = (): Guard => {
  const hasOnboarded = useUIStore((state) => state.hasOnboarded);

  return useMemo<Guard>(
    () => ({ id: 'onboarding', isNeeded: !hasOnboarded, route: ROUTE }),
    [hasOnboarded],
  );
};
