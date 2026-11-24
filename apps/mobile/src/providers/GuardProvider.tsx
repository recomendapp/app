import { createContext, use, useMemo } from 'react';
import type { Href } from 'expo-router';
import { useVersionGuard } from '../guards/useVersionGuard';
import { useOnboardingGuard } from '../guards/useOnboardingGuard';
import { useWelcomeGuard } from '../guards/useWelcomeGuard';
import type { Guard, GuardId } from '../guards/types';

type GuardContextValue = {
  /** The one guard holding the app, or null when none does. */
  activeGuard: GuardId | null;
  /**
   * Where a reader the app is refusing belongs, or null when it refuses nobody.
   * The layout hands this to `Stack.Protected` rather than restating each
   * guard's own route, so adding a guard cannot forget to name it -- and cannot
   * silently land on another guard's screen.
   */
  activeRoute: Extract<Href, string> | null;
};

const GuardContext = createContext<GuardContextValue | undefined>(undefined);

/**
 * Ranks the guards and nothing else.
 *
 * Each guard owns its own module and its own verdict. This puts them in
 * priority order and names the winner. Naming is all it does -- the root layout
 * wraps each guard's screen in its own `Stack.Protected` and the router moves
 * the reader, so an imperative replace from here would race it and lose.
 */
const GuardProvider = ({ children }: { children: React.ReactNode }) => {
  const version = useVersionGuard();
  const onboarding = useOnboardingGuard();
  const welcome = useWelcomeGuard();

  // Order = priority.
  const guards = useMemo<Guard[]>(
    () => [version, onboarding, welcome],
    [version, onboarding, welcome],
  );

  const active = useMemo(() => guards.find((guard) => guard.isNeeded) ?? null, [guards]);

  const value = useMemo<GuardContextValue>(
    () => ({ activeGuard: active?.id ?? null, activeRoute: active?.route ?? null }),
    [active],
  );

  return <GuardContext.Provider value={value}>{children}</GuardContext.Provider>;
};

const useGuard = () => {
  const context = use(GuardContext);
  if (!context) {
    throw new Error('useGuard must be used within a GuardProvider');
  }
  return context;
};

export { GuardProvider, useGuard };
