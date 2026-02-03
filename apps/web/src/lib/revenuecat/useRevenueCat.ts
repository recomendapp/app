'use client'

import { CustomerInfo, LogLevel, Purchases } from "@revenuecat/purchases-js";
import { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { authKeys } from "@/api/client/keys/authKeys";
import { REVENUECAT_API_KEY } from "../env";

export const useRevenueCat = (session: Session | null | undefined) => {
  const queryClient = useQueryClient();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | undefined>(undefined);
  
  const init = useCallback(async (session: Session) => {
    if (process.env.NODE_ENV === 'development') {
      Purchases.setLogLevel(LogLevel.Verbose);
    }
    if (!REVENUECAT_API_KEY) {
      throw new Error("RevenueCat API key missing");
    }
    const purchases = Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserId: session.user.id,
    });
    const customerInfo = await purchases.getCustomerInfo();
    await purchases.setAttributes({
      $email: session.user.email || null,
    })
    return customerInfo;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!session) {
          queryClient.setQueryData(authKeys.customerInfo(), null);
          setCustomerInfo(undefined);
          return;
        }
        const info = await init(session);
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
  }, [session, init, queryClient]);

  return { customerInfo };
};
