import { forwardRef } from 'react';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';

interface KeyboardAwareViewProps extends React.ComponentPropsWithoutRef<typeof Animated.View> {
  includeKeyboardHeight?: boolean;
}

const KeyboardAwareView = forwardRef<
  React.ComponentRef<typeof Animated.View>,
  KeyboardAwareViewProps
>(({ includeKeyboardHeight = true, style, ...props }, ref) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { progress } = useReanimatedKeyboardAnimation();

  const animatedStyle = useAnimatedStyle(() => {
    const paddingBottom = interpolate(
      progress.value,
      [0, 1],
      [insets.bottom + theme.spaces.md, theme.spaces.md],
    );
    return { paddingBottom };
  });
  return <Animated.View ref={ref} style={[{ flex: 1 }, animatedStyle, style]} {...props} />;
});
KeyboardAwareView.displayName = 'KeyboardAwareView';

export default KeyboardAwareView;
