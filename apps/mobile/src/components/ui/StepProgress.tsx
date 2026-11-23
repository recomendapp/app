import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import tw from '../../lib/tw';
import { useTheme } from '../../providers/ThemeProvider';

const DURATION = 300;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

const Segment = ({
  filled,
  height,
  trackColor,
  fillColor,
}: {
  filled: boolean;
  height: number;
  trackColor: string;
  fillColor: string;
}) => {
  const fill = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    fill.set(withTiming(filled ? 1 : 0, { duration: DURATION, easing: EASE_OUT }));
  }, [filled, fill]);

  // The fill is the only child of its own track, so animating its width
  // reflows nothing else and keeps the rounded ends a scaleX would smear.
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.get() * 100}%` }));

  return (
    <View
      style={[tw`flex-1 overflow-hidden rounded-full`, { height, backgroundColor: trackColor }]}
    >
      <Animated.View style={[tw`h-full rounded-full`, { backgroundColor: fillColor }, fillStyle]} />
    </View>
  );
};

/**
 * How far along a multi-step screen is, one bar per step rather than a single
 * one: equal shares say how many steps there are, and the step just reached
 * fills from its left edge.
 */
export const StepProgress = ({
  step,
  stepCount,
  height = 4,
  style,
}: {
  /** The step being shown, counted from 1. */
  step: number;
  stepCount: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const { colors, theme } = useTheme();

  return (
    <View
      style={[tw`flex-row`, { gap: theme.spaces.xs }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: stepCount, now: step }}
    >
      {Array.from({ length: stepCount }, (_, index) => (
        <Segment
          key={index}
          filled={index < step}
          height={height}
          trackColor={colors.border}
          fillColor={colors.foreground}
        />
      ))}
    </View>
  );
};
