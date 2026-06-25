import { Purchases } from '@revenuecat/purchases-js';
import { queryOptions } from '@tanstack/react-query';
import { authKeys } from './authKeys';
import { authClient } from '@/lib/auth/client';

export const authSessionOptions = () => {
  return queryOptions({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) throw error;
      return data;
    },
  });
};

export const authCustomerInfoOptions = ({ enabled = true }: { enabled?: boolean }) => {
  return queryOptions({
    queryKey: authKeys.customerInfo(),
    queryFn: async () => {
      return await Purchases.getSharedInstance().getCustomerInfo();
    },
    retry: 3,
    retryOnMount: true,
    enabled,
  });
};
