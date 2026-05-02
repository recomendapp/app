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
import { LoginManager, AccessToken, AuthenticationToken } from 'react-native-fbsdk-next';
import { logger } from '../logger';

type AuthContextProps = {
  user: User | null | undefined;
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

const AuthProvider = ({ children }: AuthProviderProps) => {
  const { auth } = useSplashScreen();
  const t = useTranslations();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { setLocale } = useLocaleContext();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { data: user } = useQuery(meOptions());
  const { customerInfo: initCustomerInfo } = useRevenueCat(user);
  const { data: customerInfo } = useAuthCustomerInfoQuery({
    enabled: !!initCustomerInfo,
    initialData: initCustomerInfo,
  });

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
        });
        if (error) {
          switch (error.code) {
            default:
              toast.error(upperFirst(t('common.messages.an_error_occurred')));
              break;
          }
          throw error;
        }
      }
      await queryClient.resetQueries();
    },
    [t, queryClient],
  );

  const loginWithOAuth = useCallback(
    async (provider: SocialProvider, redirectTo?: string | null) => {
      try {
        switch (provider) {
          case 'google': {
            GoogleSignin.configure({
              scopes: ['https://www.googleapis.com/auth/drive.readonly'],
              iosClientId: env.GOOGLE_IOS_CLIENT_ID,
              webClientId: env.GOOGLE_WEB_CLIENT_ID,
            });
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
            if (Platform.OS === 'ios') {
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
                if (error instanceof Error) {
                  if (!('code' in error && error.code === 'ERR_REQUEST_CANCELED')) {
                    throw error;
                  }
                } else {
                  throw error;
                }
              }
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
            const { error } = await authClient.signIn.social({
              provider: provider,
              callbackURL: makeRedirectUri({
                path: '/',
              }),
            });
            if (error) {
              switch (error.code) {
                default:
                  toast.error(upperFirst(t('common.messages.an_error_occurred')), {
                    description: error.message,
                  });
                  break;
              }
              throw error;
            }

            break;
          }
        }
        logger.metric('account:loggedInWithOAuth', { logContext: 'LoginForm', provider });
        queryClient.invalidateQueries({ queryKey: meOptions().queryKey });
      } catch (error) {
        logger.error('oauth login error', { error, provider });
      }
    },
    [authClient, queryClient, t, toast],
  );

  const logout = useCallback(async () => {
    if (pushToken) {
      const provider = Platform.OS === 'ios' || Platform.OS === 'macos' ? 'apns' : 'fcm';
      // TODO: handle token deletion on the server when the provider supports it (apns doesn't support it, but fcm does) to avoid sending notifications to invalid tokens
    }
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
  }, [authClient, queryClient, toast, t, pushToken]);

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
    if (user === undefined) return;
    auth.setReady(true);
  }, [user, auth]);

  return (
    <AuthContext.Provider
      value={{
        user,
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
