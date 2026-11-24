import RevenueCatUI from 'react-native-purchases-ui';
import { Stack, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';

const SettingsSubscriptionScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const onDimiss = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RevenueCatUI.CustomerCenterView
        onDismiss={onDimiss}
        style={{
          flex: 1,
          gap: theme.spaces.md,
          paddingBottom: insets.bottom + theme.spaces.md,
        }}
      />
    </>
  );
};

export default SettingsSubscriptionScreen;
