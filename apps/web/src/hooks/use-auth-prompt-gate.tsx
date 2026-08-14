'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from '@/lib/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useModal } from '@/context/modal-context';
import { useAuthPromptStore } from '@/stores/useAuthPromptStore';
import { ModalAuthPrompt } from '@/components/Modals/auth/ModalAuthPrompt';

const VIEW_THRESHOLD = 3;
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7;
const EXCLUDED_PATHNAME_PREFIXES = ['/auth', '/legal', '/about'];
// ModalProvider force-closes every modal shortly after a route change; opening ours in the
// same tick as the navigation that crosses the threshold would race that cleanup and lose.
const OPEN_MODAL_DELAY_MS = 500;

export const useAuthPromptGate = () => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const pathname = usePathname();
  const { viewCount, dismissedAt, registerView, reset } = useAuthPromptStore();
  const hasPromptedRef = useRef(false);

  const isGuest = user === null;
  const isAuthenticated = Boolean(user);
  const isExcludedPathname = EXCLUDED_PATHNAME_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // Authenticating clears the guest nag state, so a later logout starts counting from zero again.
  useEffect(() => {
    if (!isAuthenticated) return;
    hasPromptedRef.current = false;
    reset();
  }, [isAuthenticated, reset]);

  useEffect(() => {
    if (!isGuest || isExcludedPathname) return;
    registerView();
  }, [isGuest, pathname, isExcludedPathname, registerView]);

  useEffect(() => {
    if (!isGuest || isExcludedPathname || hasPromptedRef.current) return;
    if (viewCount < VIEW_THRESHOLD) return;
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;

    const timeoutId = setTimeout(() => {
      hasPromptedRef.current = true;
      openModal(ModalAuthPrompt, {});
    }, OPEN_MODAL_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [isGuest, isExcludedPathname, viewCount, dismissedAt, openModal]);
};
