import { useEffect, useMemo, useRef } from 'react';
import { useGuard } from '../../providers/GuardProvider';
import { useRateAppNudge } from './useRateAppNudge';
import { useUpdateAvailableNudge } from './useUpdateAvailableNudge';
import { AppNudge } from './types';

/**
 * Raises at most one nudge at a time (rate the app, an update is available),
 * in priority order, so they never land on top of each other. A nudge is only
 * ever considered once every nudge ahead of it is no longer needed.
 *
 * Nothing is raised while a guard holds the app: a review prompt over the
 * welcome flow, or a toast behind a required update, is spent for nothing.
 * Routes are not nudges -- a step the reader has to go through is a `Guard` in
 * `src/guards`, which the root layout redirects to rather than pushing over
 * whatever is on screen.
 */
export const useAppNudges = () => {
  const { activeGuard } = useGuard();
  const rateApp = useRateAppNudge();
  const updateAvailable = useUpdateAvailableNudge();

  // Order = priority.
  const nudges = useMemo(() => [rateApp, updateAvailable], [rateApp, updateAvailable]);
  const raisedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeGuard !== null) return;
    const next: AppNudge | undefined = nudges.find((nudge) => nudge.isNeeded);
    if (!next) {
      raisedIdRef.current = null;
      return;
    }
    // Already raised (or ignored) this session: don't retry.
    if (raisedIdRef.current === next.id) return;
    raisedIdRef.current = next.id;
    next.present();
  }, [activeGuard, nudges]);
};
