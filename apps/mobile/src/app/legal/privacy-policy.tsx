import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../../constants/Icons';
import tw from '../../lib/tw';
import { useTheme } from '../../providers/ThemeProvider';
import { useRedirectToWebPage } from '../../hooks/useRedirectToWebPage';

const PrivacyPolicyScreen = () => {
  const { colors } = useTheme();
  useRedirectToWebPage('/legal/privacy-policy');

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[tw`flex-1 items-center justify-center`, { backgroundColor: colors.background }]}
    >
      <Icons.Loader color={colors.mutedForeground} />
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;
