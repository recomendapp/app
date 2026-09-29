import { createContext, use, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { systemStatusQueryOptions } from '../lib/api/app-version';

type VersionPolicyContextProps = {
  isUpdateRequired: boolean;
  isUpdateAvailable: boolean;
};

const VersionPolicyContext = createContext<VersionPolicyContextProps | undefined>(undefined);

// Deliberately NOT gating the splash screen on this query: it would delay every single
// launch (even turning an API outage into a 10s stall for everyone) to protect against a
// rare event -- an outdated app briefly rendering before Stack.Protected redirects it once
// this resolves, the same way session changes already redirect reactively. The API's own
// 426 still blocks every real request in the meantime regardless of what the UI shows.
const VersionPolicyProvider = ({ children }: { children: React.ReactNode }) => {
  const { data } = useQuery(systemStatusQueryOptions());

  const value = useMemo(
    () => ({
      isUpdateRequired: data?.version.status === 'update_required',
      isUpdateAvailable: data?.version.status === 'update_available',
    }),
    [data],
  );

  return <VersionPolicyContext.Provider value={value}>{children}</VersionPolicyContext.Provider>;
};

const useVersionPolicy = () => {
  const context = use(VersionPolicyContext);
  if (!context) {
    throw new Error('useVersionPolicy must be used within a VersionPolicyProvider');
  }
  return context;
};

export { VersionPolicyProvider, useVersionPolicy };
