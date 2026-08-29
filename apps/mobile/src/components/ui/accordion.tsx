import { Text } from './text';
import tw from '../../lib/tw';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  measure,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { runOnUI } from 'react-native-worklets';
import { useTheme } from '../../providers/ThemeProvider';
import { Icon } from './icon';
import { Icons } from '../../constants/Icons';

export interface AccordionProps extends ViewProps {
  title: string | React.ReactNode;
  titleStyle?: TextStyle | TextStyle[];
  children?: React.ReactNode;
  haptic?: boolean;
  onStateChange?: (open: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  containerStyle?: ViewStyle | ViewStyle[];
  progress?: SharedValue<number>;
}

export const Accordion = forwardRef<View, AccordionProps>(
  (
    {
      title,
      children,
      disabled = false,
      haptic = true,
      style,
      containerStyle,
      titleStyle,
      progress: externalProgress,
      ...props
    },
    ref,
  ) => {
    // Refs
    const contentRef = useAnimatedRef<Animated.View>();
    // Shared values
    const heightContent = useSharedValue(0);
    const open = useSharedValue(false);
    const internalProgress = useSharedValue(0);
    const progress = externalProgress ?? internalProgress;

    useAnimatedReaction(
      () => open.value,
      (isOpen) => {
        const config = { damping: 18, stiffness: 200, mass: 0.6 };
        progress.value = withSpring(isOpen ? 1 : 0, config);
      },
    );
    const heightAnimationStyle = useAnimatedStyle(() => ({
      height: interpolate(progress.value, [0, 1], [0, heightContent.value], Extrapolation.CLAMP),
    }));

    // Trigger haptic feedback
    const triggerHapticFeedback = useCallback(() => {
      if (haptic) {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    }, [haptic]);

    // Handle actual press action
    const handlePress = useCallback(
      (e: GestureResponderEvent) => {
        if (heightContent.value === 0) {
          runOnUI(() => {
            'worklet';
            heightContent.value = measure(contentRef)?.height || 0;
          })();
        }
        triggerHapticFeedback();
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value, mutating .value is the intended API
        open.value = !open.value;
      },
      [triggerHapticFeedback, heightContent, open, contentRef],
    );

    return (
      <View ref={ref} style={[containerStyle]} {...props}>
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={[tw`flex-row items-center justify-between gap-1`]}
        >
          {typeof title === 'string' ? <Text style={titleStyle}>{title}</Text> : title}
          <Chevron progress={progress} />
        </Pressable>
        <Animated.View style={[heightAnimationStyle, tw`overflow-hidden`]}>
          <Animated.View ref={contentRef} style={tw`absolute w-full bottom-0`}>
            {children}
          </Animated.View>
        </Animated.View>
      </View>
    );
  },
);
Accordion.displayName = 'Accordion';

const Chevron = ({ progress }: { progress: SharedValue<number> }) => {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${progress.value * 180}deg`,
      },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Icon name={Icons.ChevronDown} color={colors.foreground} />
    </Animated.View>
  );
};
