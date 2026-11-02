import { useTheme } from '../../../providers/ThemeProvider';
import { Stack } from 'expo-router';
import { useTranslations } from 'use-intl';

export const unstable_settings = {
  anchor: 'forgot-password',
};

const AuthPasswordLayout = () => {
  const { defaultScreenOptions } = useTheme();
  const t = useTranslations();
  return (
    <>
      <Stack
        screenOptions={{
          ...defaultScreenOptions,
          headerTransparent: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen
          name="forgot-password"
          options={{ title: t('common.messages.forgot_password') }}
        />
        <Stack.Screen
          name="reset-password"
          options={{ title: t('common.messages.reset_your_password') }}
        />
      </Stack>
    </>
  );
};

export default AuthPasswordLayout;
