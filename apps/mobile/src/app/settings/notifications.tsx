import { useTheme } from '../../providers/ThemeProvider';
import tw from '../../lib/tw';
import { useTranslations } from 'use-intl';
import { useNotifications } from '../../providers/NotificationsProvider';
import { View } from '../../components/ui/view';
import { Linking, Platform, Pressable, ScrollView } from 'react-native';
import { Text } from '../../components/ui/text';
import { Icons } from '../../constants/Icons';
import { Separator } from '../../components/ui/separator';
import Constants from 'expo-constants';
import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingsNotificationsScreen = () => {
  const t = useTranslations();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { permissionStatus } = useNotifications();
  const openAppSettings = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const pkg = Constants.expoConfig?.android?.package;

        if (!pkg) {
          throw new Error('Package name is not defined in app config');
        }

        if (Platform.Version >= 26) {
          await startActivityAsync(ActivityAction.APP_NOTIFICATION_SETTINGS, {
            extra: {
              'android.provider.extra.APP_PACKAGE': pkg,
            },
          });
        } else {
          await startActivityAsync(ActivityAction.APPLICATION_DETAILS_SETTINGS, {
            extra: {
              'android.provider.extra.APP_PACKAGE': pkg,
            },
          });
        }
      } catch {
        await Linking.openSettings();
      }
    } else {
      await Linking.openSettings();
    }
  }, []);
  return (
    <>
      <ScrollView
        contentContainerStyle={[
          {
            gap: theme.spaces.md,
            paddingTop: theme.spaces.md,
            paddingLeft: insets.left + theme.spaces.horizontal,
            paddingRight: insets.right + theme.spaces.horizontal,
            paddingBottom: insets.bottom + theme.spaces.md,
          },
        ]}
      >
        {permissionStatus !== 'granted' && (
          <>
            <Pressable
              onPress={openAppSettings}
              style={[tw`flex-row items-center`, { gap: theme.spaces.lg }]}
            >
              <Icons.Bell color={colors.foreground} />
              <View>
                <Text textColor="muted">
                  {t('pages.settings.notifications.push_notifications.no_enabled')}
                </Text>
                <Text style={[{ color: colors.accentYellow }, tw`underline`]}>
                  {t('pages.settings.notifications.push_notifications.open_settings')}
                </Text>
              </View>
            </Pressable>
            <Separator />
          </>
        )}
        <View>
          <Text textColor="muted" style={tw`text-center`}>
            Editing notification settings is under development.
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

export default SettingsNotificationsScreen;
