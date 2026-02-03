'use client'

import { createContext, useState, useEffect, use, useMemo, useCallback } from 'react';
import { Provider, Session } from '@supabase/supabase-js';
import { User } from '@recomendapp/types';
import { useSupabaseClient } from '@/context/supabase-context';
import { CustomerInfo } from '@revenuecat/purchases-js';
import { useRevenueCat } from '@/lib/revenuecat/useRevenueCat';
import { useQuery } from '@tanstack/react-query';
import { useUserOptions } from '@/api/client/options/userOptions';
import { useAuthCustomerInfoOptions } from '@/api/client/options/authOptions';

export interface UserState {
  user: User | null | undefined;
  session: Session | null;
  customerInfo: CustomerInfo | undefined;
  loading: boolean;
  login: (email: string, password: string, redirect?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  signup: ({
      email,
      name,
      username,
      password,
      language,
      redirectTo,
  } : {
      email: string,
      name: string,
      username: string,
      password: string,
      language: string,
      redirectTo?: string | null,
  }) => Promise<void>;
  loginOAuth2: (provider: Provider, redirectTo?: string | null) => Promise<void>;
  loginWithOtp: (email: string, redirectTo?: string | null) => Promise<void>;
  userRefresh: () => Promise<void>;
  setPushToken: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<UserState | undefined>(undefined);

interface AuthProviderProps {
  session: Session | null;
  children: React.ReactNode;
}

export const AuthProvider = ({ session: initialSession, children }: AuthProviderProps) => {
  const supabase = useSupabaseClient();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const {
    data: user,
    isLoading: userLoading,
  } = useQuery(useUserOptions({
    userId: session?.user?.id,
  }));
  const loading = useMemo(() => userLoading, [userLoading]);
  const { customerInfo: initCustomerInfo } = useRevenueCat(session);
  const {
    data: customerInfo,
	} = useQuery(useAuthCustomerInfoOptions({
    enabled: !!initCustomerInfo,
    initialData: initCustomerInfo,
	}));

  const login = useCallback(async (email: string, password: string, redirectTo?: string | null) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }, [supabase]);

  const logout = useCallback(async () => {
    if (!session) return;
    if (pushToken) {
        await supabase.from('user_notification_tokens').delete().match({ token: pushToken, provider: 'fcm' });
    }
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }, [supabase, session, pushToken]);

  const signup = useCallback(async ({
    email,
    name,
    username,
    password,
    language,
    redirectTo,
  } : {
    email: string,
    name: string,
    username: string,
    password: string,
    language: string,
    redirectTo?: string | null,
  }) => {
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback${redirectTo ? `?redirect=${redirectTo}` : ''}`,
        data: {
          full_name: name,
          username: username,
          language: language,
        },
      },
    });
    if (error) throw error;
  }, [supabase]);

  const loginOAuth2 = useCallback(async (provider: Provider, redirectTo?: string | null) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${location.origin}/auth/callback${redirectTo ? `?redirect=${redirectTo}` : ''}`,
      },
    });
    if (error) throw error;
  }, [supabase]);

  const loginWithOtp = useCallback(async (email: string, redirectTo?: string | null) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback${redirectTo ? `?redirect=${redirectTo}` : ''}`,
      } 
    });
    if (error) throw error;
  }, [supabase]);

  const userRefresh = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    setSession(session);
  }, [supabase]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(prev => {
        if (
          prev?.access_token === updatedSession?.access_token &&
          prev?.expires_at === updatedSession?.expires_at
        ) {
          return prev;
        }
        return updatedSession;
      });
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // see : https://github.com/recomendapp/web-app/issues/4
  // useEffect(() => {
  //   if (user && user.language !== locale) {
  //     router.replace(
  //       // @ts-expect-error -- TypeScript will validate that only known `params`
  //       // are used in combination with a given `pathname`. Since the two will
  //       // always match for the current route, we can skip runtime checks.
  //       { pathname, params },
  //       { locale: user.language }
  //     )
  //   }
  // }, [user, locale]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        customerInfo,
        loading,
        login,
        logout,
        signup,
        loginOAuth2,
        loginWithOtp,
        userRefresh,
        setPushToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthContext');
  }
  return context;
};
