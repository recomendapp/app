import { GAP, PADDING_VERTICAL } from '../../theme/globals';
import RevenueCatUI from 'react-native-purchases-ui';
import { Stack, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SettingsSubscriptionScreen = () => {
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
          gap: GAP,
          paddingBottom: insets.bottom + PADDING_VERTICAL,
        }}
      />
    </>
  );
};

export default SettingsSubscriptionScreen;
