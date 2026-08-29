import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';
import { useUIStore } from '../stores/useUIStore';

interface NavRouteState {
  routes?: { name: string; state?: NavRouteState }[];
}

const isRouteInStack = (state: NavRouteState | undefined, name: string): boolean => {
  if (!state?.routes) return false;
  return state.routes.some((route) => route.name === name || isRouteInStack(route.state, name));
};

export const useWelcomeGate = () => {
  const { user } = useAuth();
  const router = useRouter();
  const rootState = useRootNavigationState();
  const hasOnboarded = useUIStore((state) => state.hasOnboarded);

  const needsWelcome = !!user && user.welcomedAt == null;
  const isWelcomeOpen = isRouteInStack(rootState, 'welcome');

  useEffect(() => {
    if (!hasOnboarded || !needsWelcome || isWelcomeOpen) return;
    router.push('/welcome');
  }, [hasOnboarded, needsWelcome, isWelcomeOpen, router]);
};
