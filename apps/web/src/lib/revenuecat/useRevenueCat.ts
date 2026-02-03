'use client'

import { CustomerInfo, LogLevel, Purchases } from "@revenuecat/purchases-js";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { authKeys } from "@/api/client/keys/authKeys";
import { REVENUECAT_API_KEY } from "../env";
import { UserMe } from "@packages/api-js/src";

export const useRevenueCat = (user: UserMe | null | undefined) => {
  const queryClient = useQueryClient();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | undefined>(undefined);
  
  const init = useCallback(async (user: UserMe) => {
    if (process.env.NODE_ENV === 'development') {
      Purchases.setLogLevel(LogLevel.Verbose);
    }
    if (!REVENUECAT_API_KEY) {
      throw new Error("RevenueCat API key missing");
    }
    const purchases = Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserId: user.id,
    });
    const customerInfo = await purchases.getCustomerInfo();
    await purchases.setAttributes({
      $email: user.email,
    })
    return customerInfo;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!user) {
          queryClient.setQueryData(authKeys.customerInfo(), null);
          setCustomerInfo(undefined);
          return;
        }
        const info = await init(user);
        if (!cancelled) {
          queryClient.setQueryData(authKeys.customerInfo(), info);
          setCustomerInfo(info);
        }
      } catch (err) {
        console.error(err);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user, init, queryClient]);

  return { customerInfo };
};
