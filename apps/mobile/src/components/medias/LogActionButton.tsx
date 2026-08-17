import { Pressable, View } from 'react-native';
import { LucideProps } from 'lucide-react-native';
import { Text } from '../ui/text';
import tw from '../../lib/tw';
import { useTheme } from '../../providers/ThemeProvider';

const ICON_BADGE_SIZE = 75;

interface LogActionButtonProps {
  icon: React.ComponentType<LucideProps>;
  label: string;
  onPress: () => void;
  iconColor: string;
  /** Only set for the "badge" look (icon inside a filled circle) — omit for a bare icon. */
  iconBackgroundColor?: string;
  iconFill?: string;
}

/**
 * Icon-above-label action button for the log sheets (watched / like) — Button's icon+label
 * layout is always a row, so this is built by hand instead of going through it.
 */
export const LogActionButton = ({
  icon: Icon,
  label,
  onPress,
  iconColor,
  iconBackgroundColor,
  iconFill,
}: LogActionButtonProps) => {
  const { colors } = useTheme();
  return (
    <Pressable style={tw`flex-1 items-center gap-2`} onPress={onPress}>
      <View
        style={[
          tw`items-center justify-center rounded-full`,
          { width: ICON_BADGE_SIZE, height: ICON_BADGE_SIZE },
          iconBackgroundColor ? { backgroundColor: iconBackgroundColor } : undefined,
        ]}
      >
        <Icon color={iconColor} size={50} {...(iconFill ? { fill: iconFill } : {})} />
      </View>
      <Text style={{ color: colors.foreground }}>{label}</Text>
    </Pressable>
  );
};
