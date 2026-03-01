'use client'

import { createContext, use, useCallback, useEffect } from 'react';
import { CustomerInfo } from '@revenuecat/purchases-js';
import { useRevenueCat } from '@/lib/revenuecat/useRevenueCat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthCustomerInfoOptions } from '@/api/client/options/authOptions';
import { SocialProvider } from 'better-auth/types';
import { authClient } from '@/lib/auth/client';
import toast from 'react-hot-toast';
import { upperFirst } from 'lodash';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { userMeOptions, useUserMeUpdateMutation } from '@libs/query-client';
import { User } from '@packages/api-js/src';

export interface UserState {
  user: User | null | undefined;
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
}

const AuthContext = createContext<UserState | undefined>(undefined);

interface AuthProviderProps {
  user: User | null;
  children: React.ReactNode;
}

export const AuthProvider = ({ user: initialUser, children }: AuthProviderProps) => {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    ...userMeOptions(),
    initialData: initialUser || undefined,
  });
  const { customerInfo: initCustomerInfo } = useRevenueCat(user);
  const {
    data: customerInfo,
	} = useQuery(useAuthCustomerInfoOptions({
    enabled: !!initCustomerInfo,
    initialData: initCustomerInfo,
	}));

  const { mutate: updateUser } = useUserMeUpdateMutation();

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
    await queryClient.invalidateQueries({ queryKey: userMeOptions().queryKey });
    router.push(credentials.redirectTo || '/');
  }, [t, router, queryClient]);

  const logout = useCallback(async () => {
    if (!user) return;
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
    queryClient.setQueryData(userMeOptions().queryKey, undefined);
    router.refresh();
  }, [user, t, router, queryClient]);

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
      language: locale,
      callbackURL: `${location.origin}/auth/callback${redirectTo ? `?redirect=${redirectTo}` : ''}`
    });
    if (error) {
      switch (error.code) {
        case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
          toast.error(t('common.form.email.error.unavailable'));
          break;
        default:
          toast.error(upperFirst(t('common.messages.an_error_occurred')));
          break;
      }
      throw error;
    }
    toast.success(t('pages.auth.signup.form.success', { email }));
  }, [t, locale]);

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

  useEffect(() => {
    if (user && locale && user.language !== locale) {
      updateUser({ body: { language: locale } });
    }
  }, [user, locale, updateUser]);

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
