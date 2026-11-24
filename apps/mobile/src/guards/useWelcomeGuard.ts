import { useMemo } from 'react';
import type { Href } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';
import type { Guard } from './types';

const ROUTE: Extract<Href, string> = '/welcome';

/**
 * Holds a brand-new account behind the welcome flow, until the API says it has
 * been through it.
 *
 * `welcomedAt` is written optimistically by the flow's own `finish`, so the
 * guard releases on the tap rather than on the round trip.
 */
export const useWelcomeGuard = (): Guard => {
  const { user } = useAuth();
  const isNeeded = !!user && user.welcomedAt == null;

  return useMemo<Guard>(() => ({ id: 'welcome', isNeeded, route: ROUTE }), [isNeeded]);
};
