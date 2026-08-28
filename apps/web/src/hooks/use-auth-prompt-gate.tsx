'use client';

import { useEffect } from 'react';
import { usePathname } from '@/lib/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useGate } from '@/context/gate-context';
import { useAuthPromptStore } from '@/stores/useAuthPromptStore';
import { ModalAuthPrompt } from '@/components/Modals/auth/ModalAuthPrompt';

const VIEW_THRESHOLD = 3;
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7;
const EXCLUDED_PATHNAME_PREFIXES = ['/auth', '/legal', '/about'];

export const useAuthPromptGate = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const { viewCount, dismissedAt, registerView, reset } = useAuthPromptStore();

  const isGuest = user === null;
  const isAuthenticated = Boolean(user);
  const isExcludedPathname = EXCLUDED_PATHNAME_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // Authenticating clears the guest nag state, so a later logout starts counting from zero again.
  useEffect(() => {
    if (!isAuthenticated) return;
    reset();
  }, [isAuthenticated, reset]);

  useEffect(() => {
    if (!isGuest || isExcludedPathname) return;
    registerView();
  }, [isGuest, pathname, isExcludedPathname, registerView]);

  const isDismissed = dismissedAt !== null && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  const isEligible = isGuest && !isExcludedPathname && viewCount >= VIEW_THRESHOLD && !isDismissed;

  useGate('auth-prompt', isEligible, ModalAuthPrompt);
};
