'use client'

import { createContext, useState, use, useCallback } from 'react';
import { CustomerInfo } from '@revenuecat/purchases-js';
import { useRevenueCat } from '@/lib/revenuecat/useRevenueCat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthCustomerInfoOptions } from '@/api/client/options/authOptions';
import { SocialProvider } from 'better-auth/types';
import { authClient } from '@/lib/auth/client';
import toast from 'react-hot-toast';
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { useUserMeOptions } from '@libs/query-client';
import { UserMe } from '@packages/api-js/src';

export interface UserState {
  user: UserMe | null | undefined;
  customerInfo: CustomerInfo | undefined;
  login: (credentials: { 
    password: string, 
    redirectTo?: string | null 
  } & (
    | { email: string; username?: never }
    | { username: string; email?: never }
  )) => Promise<void>;
  logout: () => Promise<void>;
  signup: ({
      email,
      name,
      username,
      password,
      redirectTo,
  } : {
      email: string,
      name: string,
      username: string,
      password: string,
      redirectTo?: string | null,
  }) => Promise<void>;
  loginOAuth2: (provider: SocialProvider, redirectTo?: string | null) => Promise<void>;
  loginWithMagicLink: (email: string, redirectTo?: string | null) => Promise<void>;
  setPushToken: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<UserState | undefined>(undefined);

interface AuthProviderProps {
  session: UserMe | null;
  children: React.ReactNode;
}

export const AuthProvider = ({ session: initialSession, children }: AuthProviderProps) => {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    ...useUserMeOptions(),
    initialData: initialSession || undefined,
  });

  const [pushToken, setPushToken] = useState<string | null>(null);
  const { customerInfo: initCustomerInfo } = useRevenueCat(user);
  const {
    data: customerInfo,
	} = useQuery(useAuthCustomerInfoOptions({
    enabled: !!initCustomerInfo,
    initialData: initCustomerInfo,
	}));

  const login = useCallback(async (credentials: { 
    password: string, 
    redirectTo?: string | null 
  } & (
    | { email: string; username?: never }
    | { username: string; email?: never }
  )) => {
    if (credentials.email) {
      const { error } = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) {
        switch (error.code) {
          case 'INVALID_EMAIL_OR_PASSWORD':
            toast.error(t('pages.auth.login.form.wrong_credentials'));
            break;
          default:
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
            break;
        }
        throw error;
      };
    } else if (credentials.username) {
      const { error } = await authClient.signIn.username({
        username: credentials.username,
        password: credentials.password,
      });
      if (error) {
        switch (error.code) {
          // TODO: handle specific error codes
          default:
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
            break;
        }
        throw error;
      };
    }
    await queryClient.invalidateQueries({ queryKey: useUserMeOptions().queryKey });
    router.push(credentials.redirectTo || '/');
  }, [t, router, queryClient]);

  const logout = useCallback(async () => {
    if (!user) return;
    // TODO: re-enable notification tokens management
    if (pushToken) {
    //     await supabase.from('user_notification_tokens').delete().match({ token: pushToken, provider: 'fcm' });
    }
    const { error } = await authClient.signOut();
    if (error) {
      switch (error.code) {
        // TODO: handle specific error codes
        default:
          toast.error(upperFirst(t('common.messages.an_error_occurred')));
          break;
      }
      throw error;
    }
    queryClient.setQueryData(useUserMeOptions().queryKey, undefined);
    router.refresh();
  }, [user, pushToken, t, router, queryClient]);

  const signup = useCallback(async ({
    email,
    name,
    username,
    password,
    redirectTo,
  } : {
    email: string,
    name: string,
    username: string,
    password: string,
    redirectTo?: string | null,
  }) => {
    const { error } = await authClient.signUp.email({
      email: email,
      name: name,
      username: username,
      password: password,
      callbackURL: `${location.origin}/auth/callback${redirectTo ? `?redirect=${redirectTo}` : ''}`
    });
    if (error) {
      switch (error.code) {
        default:
          toast.error(upperFirst(t('common.messages.an_error_occurred')));
          break;
      }
      throw error;
    }
    toast.success(t('pages.auth.signup.form.success', { email }));
  }, [t]);

  const loginOAuth2 = useCallback(async (provider: SocialProvider, redirectTo?: string | null) => {
    const { error } = await authClient.signIn.social({
      provider: provider,
      callbackURL: location.origin + (redirectTo ? !redirectTo?.startsWith('/') ? `/${redirectTo}` : redirectTo : ''),
    });
    if (error) {
      switch (error.code) {
        // TODO: handle specific error codes
        default:
          toast.error(upperFirst(t('common.messages.an_error_occurred')));
          break;
      }
      throw error;
    };
  }, [t]);

  const loginWithMagicLink = useCallback(async (email: string, redirectTo?: string | null) => {
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: location.origin + (redirectTo ? !redirectTo?.startsWith('/') ? `/${redirectTo}` : redirectTo : ''),
    });
    if (error) {
      switch (error.code) {
        // TODO: handle specific error codes
        default:
          toast.error(upperFirst(t('common.messages.an_error_occurred')));
          break;
      }
      throw error;
    };
    toast.success(t('common.form.code_sent', { email }));
  }, [t]);

  return (
    <AuthContext.Provider
      value={{
        user,
        customerInfo,
        login,
        logout,
        signup,
        loginOAuth2,
        loginWithMagicLink,
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
