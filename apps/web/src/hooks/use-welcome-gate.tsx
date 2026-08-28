'use client';

import { useMemo } from 'react';
import { usePathname } from '@/lib/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { useGate } from '@/context/gate-context';
import { ModalWelcome } from '@/components/Modals/ModalWelcome';

const EXCLUDED_PATHNAME_PREFIXES = ['/welcome'];

export const useWelcomeGate = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  const isExcludedPathname = EXCLUDED_PATHNAME_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  const needsWelcome = useMemo(() => Boolean(user) && user?.welcomedAt == null, [user]);

  useGate('welcome', needsWelcome && !isExcludedPathname, ModalWelcome);
};
