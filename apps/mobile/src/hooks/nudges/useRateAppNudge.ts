import { useCallback, useEffect } from 'react';
import * as StoreReview from 'expo-store-review';
import { useAuth } from '../../providers/AuthProvider';
import { useUIStore } from '../../stores/useUIStore';
import { AppNudge } from './types';

/**
 * Number of app sessions to wait before ever asking for a rating, so the prompt
 * lands on someone who has actually used the app, not on their first launch.
 */
const MIN_APP_OPENS_BEFORE_PROMPT = 3;

export const useRateAppNudge = (): AppNudge => {
  const { user } = useAuth();
  const appOpenCount = useUIStore((state) => state.appOpenCount);
  const incrementAppOpenCount = useUIStore((state) => state.incrementAppOpenCount);
  const hasRequestedReview = useUIStore((state) => state.hasRequestedReview);
  const setHasRequestedReview = useUIStore((state) => state.setHasRequestedReview);

  // The runner lives in the root layout, so this fires once per app session.
  useEffect(() => {
    incrementAppOpenCount();
  }, [incrementAppOpenCount]);

  const present = useCallback(() => {
    setHasRequestedReview(true);
    StoreReview.requestReview();
  }, [setHasRequestedReview]);

  return {
    id: 'rate-app',
    isNeeded: !!user && !hasRequestedReview && appOpenCount >= MIN_APP_OPENS_BEFORE_PROMPT,
    present,
  };
};
