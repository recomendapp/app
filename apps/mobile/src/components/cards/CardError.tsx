import { useTheme } from '../../providers/ThemeProvider';
import { View } from '../ui/view';
import { Text } from '../ui/text';
import { useTranslations } from 'use-intl';
import { LucideProps } from 'lucide-react-native';
import tw from '../../lib/tw';
import { Icon } from '../ui/icon';
import { Icons } from '../../constants/Icons';

interface CardErrorProps extends React.ComponentProps<typeof View> {
  icon?: React.ComponentType<LucideProps> | string;
  label?: string;
}

export const CardError = ({ icon, label, style, ...props }: CardErrorProps) => {
  const { colors } = useTheme();
  const t = useTranslations();
  return (
    <View style={[tw`items-center justify-center gap-2`, style]} {...props}>
      <View
        style={[
          tw`p-4 rounded-5`,
          {
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {typeof icon === 'string' ? (
          <Text style={{ fontSize: 40 }}>{icon}</Text>
        ) : (
          <Icon name={icon || Icons.AlertCircle} size={100} color={colors.mutedForeground} />
        )}
      </View>
      <Text textColor="muted" style={tw`text-center max-w-xs`}>
        {label || t('common.messages.an_error_occurred')}
      </Text>
    </View>
  );
};
