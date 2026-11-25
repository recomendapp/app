import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { Text } from '../../../ui/text';
import { View } from '../../../ui/view';
import { Icons } from '../../../../constants/Icons';
import tw from '../../../../lib/tw';
import { useTheme } from '../../../../providers/ThemeProvider';

/** Why there is nothing to show under the header of a private profile. */
const ProfilePrivateCard = () => {
  const { colors } = useTheme();
  const t = useTranslations();

  return (
    <View style={tw`items-center justify-center gap-2 px-4 py-8`}>
      <Icons.Lock color={colors.foreground} />
      <View style={tw`items-center`}>
        <Text>{upperFirst(t('common.messages.this_account_is_private'))}</Text>
        <Text style={{ color: colors.mutedForeground }}>
          {upperFirst(t('common.messages.follow_to_see_activities'))}
        </Text>
      </View>
    </View>
  );
};

export default ProfilePrivateCard;
