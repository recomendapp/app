import { Button } from 'apps/mobile/src/components/ui/Button';
import { Text } from 'apps/mobile/src/components/ui/text';
import { View } from 'apps/mobile/src/components/ui/view';
import tw from 'apps/mobile/src/lib/tw';
import { useTheme } from 'apps/mobile/src/providers/ThemeProvider';
import { Stack, useRouter } from 'expo-router';

const NotFoundScreen = () => {
  const router = useRouter();
  const { bottomOffset } = useTheme();
  return (
  <>
    <Stack.Screen options={{ title: 'Oops!' }} /> 
    <View
    style={[
      tw.style("flex-1 justify-center items-center gap-2"),
      { paddingBottom: bottomOffset },
    ]}
    >
      <Text style={tw.style("text-3xl font-bold")}>This screen doesn&apos;t exist.</Text>

      <Button onPress={() => router.back()}>Go back!</Button>
    </View>
  </>
  );
};

export default NotFoundScreen;