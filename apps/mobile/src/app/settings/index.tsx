import { useToast } from '../../components/Toast';
import { Button } from '../../components/ui/Button';
import { Text } from '../../components/ui/text';
import { View } from '../../components/ui/view';
import { Icons } from '../../constants/Icons';
import tw from '../../lib/tw';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../theme/globals';
import { LegendList } from '@legendapp/list/react-native';
import { AuthError } from 'expo-auth-session';
import { Href, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { LucideIcon } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Alert, Pressable } from 'react-native';
import { useTranslations } from 'use-intl';
import * as Application from 'expo-application';
import app from '../../constants/app';
import { Badge } from '../../components/ui/Badge';
import { client } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

type BaseRoute = {
  label: string;
  icon: LucideIcon;
  authOnly?: boolean;
  color?: string;
  rightComponent?: React.ReactNode;
};

type Route = BaseRoute &
  (
    | {
        route: Href;
        onPress?: never;
      }
    | {
        onPress: () => void;
        route?: never;
      }
  );

const SettingsScreen = () => {
  const { user, customerInfo, logout, forceLogout } = useAuth();
  const { colors, mode } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTranslations();

  const appVersion = useMemo(() => Application.nativeApplicationVersion, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      let errorMessage = upperFirst(t('common.messages.an_error_occurred'));
      if (error instanceof AuthError) {
        errorMessage = upperFirst(t('common.messages.error'));
      }
      toast.error(upperFirst(t('common.messages.error')), { description: errorMessage });
      await forceLogout();
    }
  }, [logout, forceLogout, t, toast]);
  const handleOpenLegalPage = useCallback((path: string) => {
    WebBrowser.openBrowserAsync(`https://${app.webDomain}${path}`);
  }, []);
  const handleLogoutButtonPress = useCallback(() => {
    Alert.alert(
      upperFirst(t('common.messages.are_u_sure')),
      undefined,
      [
        {
          text: upperFirst(t('common.messages.cancel')),
          style: 'cancel',
        },
        {
          text: upperFirst(t('common.messages.logout')),
          style: 'destructive',
          onPress: handleLogout,
        },
      ],
      {
        userInterfaceStyle: mode,
      },
    );
  }, [handleLogout, t, mode]);
  const routes = useMemo((): Route[] => {
    const routes: Route[] = [
      {
        label: upperFirst(t('pages.settings.profile.label')),
        route: '/settings/profile',
        icon: Icons.User,
        authOnly: true,
      },
      {
        label: upperFirst(t('pages.settings.account.label')),
        route: '/settings/account',
        icon: Icons.Lock,
        authOnly: true,
      },
      {
        label: upperFirst(t('pages.settings.subscription.label')),
        route: '/settings/subscription',
        icon: Icons.CreditCard,
        authOnly: true,
        rightComponent:
          customerInfo?.activeSubscriptions.length === 0 ? (
            <Pressable onPress={() => router.push({ pathname: '/upgrade' })}>
              <Badge variant="accent-yellow">
                {upperFirst(t('common.messages.upgrade_to_plan', { plan: 'Premium' }))}
              </Badge>
            </Pressable>
          ) : undefined,
      },
      {
        label: upperFirst(t('pages.settings.security.label')),
        route: '/settings/security',
        icon: Icons.Shield,
        authOnly: true,
      },
      {
        label: upperFirst(t('pages.settings.notifications.label')),
        route: '/settings/notifications',
        icon: Icons.Bell,
        authOnly: true,
      },
      {
        label: upperFirst(t('pages.settings.data.label')),
        route: '/settings/data/imports',
        icon: Icons.Database,
        authOnly: true,
      },
      {
        label: upperFirst(t('pages.settings.appearance.label')),
        route: '/settings/appearance',
        icon: Icons.Eye,
      },
      {
        label: upperFirst(t('common.messages.terms_of_use')),
        onPress: () => handleOpenLegalPage('/legal/terms-of-use'),
        icon: Icons.TermsOfUse,
      },
      {
        label: upperFirst(t('common.messages.privacy_policy')),
        onPress: () => handleOpenLegalPage('/legal/privacy-policy'),
        icon: Icons.PrivacyPolicy,
      },
      { label: upperFirst(t('common.messages.about')), route: '/about', icon: Icons.info },
      {
        label: upperFirst(t('common.messages.logout')),
        onPress: handleLogoutButtonPress,
        icon: Icons.logout,
        authOnly: true,
        color: colors.destructive,
      },
    ];
    return routes.filter((route) => !route.authOnly || (route.authOnly && user));
  }, [
    t,
    user,
    handleLogoutButtonPress,
    handleOpenLegalPage,
    colors.destructive,
    customerInfo,
    router,
  ]);

  const renderItem = useCallback(
    ({ item, index }: { item: Route; index: number }) => (
      <Button
        variant="ghost"
        size="fit"
        icon={item.icon}
        iconProps={{
          color: item.color || colors.foreground,
        }}
        onPress={() => {
          if (item.route) {
            router.push(item.route);
          } else {
            item.onPress();
          }
        }}
        style={[
          {
            paddingVertical: PADDING_HORIZONTAL,
            paddingHorizontal: PADDING_HORIZONTAL,
          },
        ]}
      >
        <View style={tw`flex-1 flex-row items-center gap-2 justify-between`}>
          <Text style={{ color: item.color || colors.foreground }}>{item.label}</Text>
          <View style={tw`flex-row items-center gap-2`}>
            {item.rightComponent}
            <Icons.ChevronRight color={item.color || colors.mutedForeground} size={16} />
          </View>
        </View>
      </Button>
    ),
    [colors.foreground, colors.mutedForeground, router],
  );

  const renderFooter = useCallback(
    () => (
      <Pressable
        onPress={() => Alert.alert(`DEBUG`, `Api URL: ${client.getConfig().baseUrl}`)}
        style={[
          tw`items-center justify-center`,
          { paddingHorizontal: PADDING_HORIZONTAL, paddingVertical: PADDING_VERTICAL * 2 },
        ]}
      >
        <Text textColor="muted">
          {app.name} •{' '}
          {upperFirst(t('common.messages.version_value', { value: appVersion || 'N/A' }))}
        </Text>
      </Pressable>
    ),
    [appVersion, t],
  );

  return (
    <>
      <LegendList
        data={routes}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingBottom: insets.bottom + PADDING_VERTICAL,
        }}
        ItemSeparatorComponent={() => (
          <View style={[{ backgroundColor: colors.muted, height: 1 }, tw` w-full`]} />
        )}
        keyExtractor={useCallback((_: Route, number: number) => number.toString(), [])}
        ListFooterComponent={renderFooter}
      />
    </>
  );
};

export default SettingsScreen;
