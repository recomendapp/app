import { useTheme } from '../../providers/ThemeProvider';
import { View } from '../ui/view';
import { Text } from '../ui/text';
import { LucideProps } from 'lucide-react-native';
import tw from '../../lib/tw';
import { Icon } from '../ui/icon';

interface CardEmptyProps extends React.ComponentProps<typeof View> {
  icon: React.ComponentType<LucideProps> | string;
  label: string;
}

export const CardEmpty = ({ icon, label, style, ...props }: CardEmptyProps) => {
  const { colors } = useTheme();
  return (
    <View style={[tw`items-center justify-center gap-2`, style]} {...props}>
      <View
        style={[
          tw`p-4 rounded-4 aspect-square`,
          {
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {typeof icon === 'string' ? (
          <Text style={{ fontSize: 40 }}>{icon}</Text>
        ) : (
          <Icon name={icon} size={40} color={colors.foreground} />
        )}
      </View>
      <Text textColor="muted" style={tw`text-center max-w-xs`}>
        {label}
      </Text>
      {props.children}
    </View>
  );
};
