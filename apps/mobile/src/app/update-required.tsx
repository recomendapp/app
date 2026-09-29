import { Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { Text } from '../components/ui/text';
import { Button } from '../components/ui/Button';
import { Icons } from '../constants/Icons';
import { useTheme } from '../providers/ThemeProvider';
import { MOBILE_APP_STORE_URL } from '../lib/api/app-version';
import tw from '../lib/tw';

const UpdateRequiredScreen = () => {
  const t = useTranslations();
  const { colors } = useTheme();
  const storeUrl = MOBILE_APP_STORE_URL;

  return (
    <SafeAreaView
      style={[
        tw`flex-1 items-center justify-center gap-4 px-8`,
        { backgroundColor: colors.background },
      ]}
    >
      <Icons.Reload color={colors.accentYellow} size={48} />
      <Text variant="heading" style={tw`text-center`}>
        {t('common.messages.update_required_title')}
      </Text>
      <Text textColor="muted" style={tw`text-center`}>
        {t('common.messages.update_required_description')}
      </Text>
      {storeUrl && (
        <Button
          size="lg"
          containerStyle={tw`self-stretch mt-4`}
          onPress={() => Linking.openURL(storeUrl)}
        >
          {t('common.messages.update_app')}
        </Button>
      )}
    </SafeAreaView>
  );
};

export default UpdateRequiredScreen;
