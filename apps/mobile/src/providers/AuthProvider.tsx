import { createContext, use, useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useSplashScreen } from './SplashScreenProvider';
import { useLocaleContext } from './LocaleProvider';
import { useRevenueCat } from '../hooks/useRevenueCat';
import { CustomerInfo } from 'react-native-purchases';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { randomUUID } from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as env from '../env';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { useAuthCustomerInfoQuery } from '../api/auth/authQueries';
import { User } from '@libs/api-js';
import { meOptions } from '@libs/query-client';
import { authClient } from '../lib/auth/client';
import { useToast } from '../components/Toast';
import { SocialProvider } from 'better-auth/types';
import { defaultSupportedLocale, SupportedLocale, supportedLocales } from '@libs/i18n';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { LoginManager, AccessToken, AuthenticationToken } from 'react-native-fbsdk-next';
import { logger } from '../logger';
import { authSessionOptions } from '../api/auth/authOptions';

type AuthContextProps = {
  user: User | null | undefined;
  session: typeof authClient.$Infer.Session | null | undefined;
  customerInfo: CustomerInfo | undefined;
  login: (
    credentials: { password: string } & ({ email: string } | { username: string }),
  ) => Promise<void>;
  loginWithOAuth: (provider: SocialProvider, redirectTo?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => Promise<void>;
  safeLogout: (withConfirm?: boolean) => Promise<void>;
  pushToken: string | null;
  setPushToken: (token: string | null) => void;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

GoogleSignin.configure({
  iosClientId: env.GOOGLE_IOS_CLIENT_ID,
  webClientId: env.GOOGLE_WEB_CLIENT_ID,
});

const AuthProvider = ({ children }: AuthProviderProps) => {
  const { auth } = useSplashScreen();
  const t = useTranslations();
  const toast = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setLocale } = useLocaleContext();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { data: session } = useQuery(authSessionOptions());
  const { data: user, status: userStatus } = useQuery({
    ...meOptions(),
    retry: (failureCount, error) => {
      const status =
        (error as { statusCode?: number; status?: number } | undefined)?.statusCode ??
        (error as { statusCode?: number; status?: number } | undefined)?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
  const { customerInfo: initCustomerInfo } = useRevenueCat(user);
  const { data: customerInfo } = useAuthCustomerInfoQuery({
    enabled: !!initCustomerInfo,
    initialData: initCustomerInfo,
  });

  /**
   * Closes whatever is presented, before the session is published.
   *
   * Publishing it unregisters the auth screens, and react-native-screens
   * refuses to have a modal taken away from under a presented one -- a sheet
   * opened over the auth modal is exactly that pair. Dismissing here, while
   * they are all still registered, leaves the guard nothing to take away.
   *
   * `dismissAll` and not a counted `dismiss`: it dispatches one `POP_TO_TOP`,
   * which empties the presented modals in a single action. A counted `POP`
   * leaves the crash in place. The cost is its reach -- it returns to the
   * stack's first screen, so anything the reader had opened underneath goes
   * with it.
   */
  const dismissAuthScreens = useCallback(() => {
    if (router.canDismiss()) router.dismissAll();
  }, [router]);

  /**
   * The hosted flow: the expo client opens it in a browser session and stores
   * the session cookie the redirect carries back. It is the way in for every
   * provider with no native SDK on this platform.
   */
  const signInWithBrowser = useCallback(
    async (provider: SocialProvider) => {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: makeRedirectUri({ path: '/' }),
      });
      if (error) {
        toast.error(upperFirst(t('common.messages.an_error_occurred')), {
          description: error.message,
        });
        throw error;
      }
    },
    [t, toast],
  );

  // Handlers
  const login = useCallback(
    async (
      credentials: {
        password: string;
        redirectTo?: string | null;
      } & ({ email: string; username?: never } | { username: string; email?: never }),
    ) => {
      if (credentials.email) {
        const { error } = await authClient.signIn.email({
          email: credentials.email,
          password: credentials.password,
          rememberMe: true,
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
        }
      } else if (credentials.username) {
        const { error } = await authClient.signIn.username({
          username: credentials.username,
          password: credentials.password,
          rememberMe: true,
        });
        if (error) {
          switch (error.code) {
            // An unknown username, a too short/long one and a wrong password
            // all land here: on a sign-in form they are the same mistake, and
            // the username plugin only tells them apart to the extent that
            // saying so would leak which usernames exist.
            case 'INVALID_USERNAME_OR_PASSWORD':
            case 'USERNAME_TOO_SHORT':
            case 'USERNAME_TOO_LONG':
            case 'INVALID_USERNAME':
              toast.error(t('pages.auth.login.form.wrong_credentials'));
              break;
            default:
              toast.error(upperFirst(t('common.messages.an_error_occurred')));
              break;
          }
          throw error;
        }
      }
      dismissAuthScreens();
      await queryClient.resetQueries();
    },
    [t, queryClient, toast, dismissAuthScreens],
  );

  const loginWithOAuth = useCallback(
    async (provider: SocialProvider, redirectTo?: string | null) => {
      try {
        switch (provider) {
          case 'google': {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            if (userInfo.type === 'cancelled') return;
            if (!userInfo.data?.idToken) {
              toast.error(upperFirst(t('common.messages.an_error_occurred')));
              throw new Error('No ID token received');
            }
            const { error: googleError } = await authClient.signIn.social({
              provider: 'google',
              idToken: {
                token: userInfo.data.idToken,
              },
            });
            if (googleError) {
              switch (googleError.code) {
                default:
                  toast.error(upperFirst(t('common.messages.an_error_occurred')));
                  break;
              }
              throw googleError;
            }
            break;
          }
          case 'apple': {
            // No native Apple SDK off iOS. Nothing used to run here at all:
            // the case broke straight to the success path below, which
            // reported a sign-in, dismissed the sheet and refetched -- without
            // ever asking Apple anything.
            if (Platform.OS !== 'ios') {
              await signInWithBrowser(provider);
              break;
            }
            try {
              const rawNone = randomUUID();
              const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                state: rawNone,
              });
              if (credential.state !== rawNone) {
                toast.error(upperFirst(t('common.messages.an_error_occurred')));
                throw new Error('State does not match');
              }
              const { identityToken } = credential;
              if (!identityToken) {
                toast.error(upperFirst(t('common.messages.an_error_occurred')));
                throw new Error('No identity token provided');
              }
              const { error: appleError } = await authClient.signIn.social({
                provider: 'apple',
                idToken: {
                  token: identityToken,
                },
              });
              if (appleError) {
                switch (appleError.code) {
                  default:
                    toast.error(upperFirst(t('common.messages.an_error_occurred')), {
                      description: appleError.message,
                    });
                    break;
                }
                throw appleError;
              }
            } catch (error) {
              // A cancelled request is not a sign-in: returning keeps it off
              // the success path, the way the Google branch does.
              if (
                error instanceof Error &&
                'code' in error &&
                error.code === 'ERR_REQUEST_CANCELED'
              ) {
                return;
              }
              throw error;
            }
            break;
          }
          case 'facebook': {
            const fbResult = await LoginManager.logInWithPermissions(
              ['public_profile', 'email'],
              'limited',
            );

            if (fbResult.isCancelled) {
              return;
            }

            let fbToken: string | undefined = undefined;

            if (Platform.OS === 'ios') {
              const authData = await AuthenticationToken.getAuthenticationTokenIOS();
              fbToken = authData?.authenticationToken;
            } else {
              const accessData = await AccessToken.getCurrentAccessToken();
              fbToken = accessData?.accessToken.toString();
            }

            if (!fbToken) {
              toast.error(upperFirst(t('common.messages.an_error_occurred')));
              throw new Error('No Facebook token received');
            }

            const { error: fbError } = await authClient.signIn.social({
              provider: 'facebook',
              idToken: {
                token: fbToken,
              },
            });

            if (fbError) {
              switch (fbError.code) {
                default:
                  toast.error(upperFirst(t('common.messages.an_error_occurred')), {
                    description: fbError.message,
                  });
                  break;
              }
              throw fbError;
            }
            break;
          }
          default: {
            await signInWithBrowser(provider);
            break;
          }
        }
        logger.metric('account:loggedInWithOAuth', { logContext: 'LoginForm', provider });
        dismissAuthScreens();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: meOptions().queryKey }),
          queryClient.invalidateQueries({ queryKey: authSessionOptions().queryKey }),
        ]);
      } catch (error) {
        logger.error('oauth login error', { error, provider });
      }
    },
    [queryClient, t, toast, dismissAuthScreens, signInWithBrowser],
  );

  const logout = useCallback(async () => {
    const { error } = await authClient.signOut();
    if (error) {
      switch (error.code) {
        default:
          toast.error(upperFirst(t('common.messages.an_error_occurred')));
          break;
      }
      throw error;
    }
    queryClient.resetQueries();
  }, [queryClient, toast, t]);

  const forceLogout = useCallback(async () => {
    await authClient.signOut();
    queryClient.resetQueries();
  }, [queryClient]);

  const safeLogout = useCallback(
    async (withConfirm = true) => {
      if (withConfirm) {
        Alert.alert(upperFirst(t('common.messages.are_u_sure')), undefined, [
          {
            text: upperFirst(t('common.messages.cancel')),
            style: 'cancel',
          },
          {
            text: upperFirst(t('common.messages.logout')),
            style: 'destructive',
            onPress: async () => {
              try {
                await logout();
              } catch {
                await forceLogout();
              }
            },
          },
        ]);
      } else {
        try {
          await logout();
        } catch {
          await forceLogout();
        }
      }
    },
    [logout, forceLogout, t],
  );

  const syncLanguage = useCallback(
    async (data: User) => {
      if (data?.language) {
        if (supportedLocales.includes(data.language as SupportedLocale)) {
          setLocale(data.language);
        } else {
          setLocale(defaultSupportedLocale);
        }
      }
    },
    [setLocale],
  );

  useEffect(() => {
    if (user) {
      syncLanguage(user);
    }
  }, [user, syncLanguage]);

  useEffect(() => {
    // Fire on both success and error - a definitive "not logged in" must
    // unblock the splash screen just as much as a successful fetch does.
    if (userStatus === 'pending') return;
    auth.setReady(true);
  }, [userStatus, auth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        customerInfo,
        login,
        loginWithOAuth,
        logout,
        forceLogout,
        safeLogout,
        pushToken,
        setPushToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
