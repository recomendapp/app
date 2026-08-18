'use client';

import { useRealtimeSync } from '@libs/query-client';
import { useAuth } from '@/context/auth-context';

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  useRealtimeSync(!!user);

  return children;
};
