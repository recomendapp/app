import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, ReduceMotion, useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { LucideProps } from 'lucide-react-native';
import { Icons } from '../../constants/Icons';
import tw from '../../lib/tw';
import { Button } from './Button';
import { StepProgress } from './StepProgress';
import { FloatingFooter } from './FloatingFooter';
import { useTranslations } from 'use-intl';
import { useTheme } from '../../providers/ThemeProvider';

interface MultiStepScreenProps {
  /**
   * The step's own content, in a box spanning what is left between the top of
   * the screen and the footer. Nothing here scrolls: a step that needs to say
   * so brings its own scroll view, so a step holding a list is not nested in
   * one.
   */
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  currentStepKey?: string | number;
  /**
   * How many steps the screen has. With it and a numbered `currentStepKey`, a
   * bar at the top says how far along the reader is.
   */
  stepCount?: number;
  /** Set to false to keep the progress bar off a screen that could show one. */
  showProgress?: boolean;

  onNext: () => void | Promise<void>;
  onBack?: () => void;
  canGoBack?: boolean;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  nextIcon?: React.ComponentType<LucideProps>;
}

export const MultiStepScreen = ({
  children,
  containerStyle,
  footerStyle,
  currentStepKey,
  stepCount,
  showProgress = true,
  onNext,
  onBack,
  canGoBack = false,
  isNextDisabled = false,
  isLoading = false,
  nextLabel: nextLabelProp,
  nextIcon = Icons.ChevronRight,
}: MultiStepScreenProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslations();
  const nextLabel = nextLabelProp || t('common.messages.continue');

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  // The footer reserves its own height ahead of itself, but it rides above the
  // keyboard: the content gives up that height too, so the box always ends
  // where the footer starts.
  const animatedContainerStyle = useAnimatedStyle(() => ({
    marginBottom: Math.abs(keyboardHeight.get()),
  }));

  // Nothing to draw without both ends of the count.
  const step =
    showProgress && stepCount && typeof currentStepKey === 'number'
      ? Math.min(Math.max(currentStepKey, 0), stepCount)
      : null;

  return (
    <>
      {/* Outside the container, which a screen may strip of its padding to
          let a list reach the edges: the bar keeps its own either way. */}
      {step !== null && stepCount !== undefined && (
        <StepProgress
          step={step}
          stepCount={stepCount}
          style={{
            paddingLeft: insets.left + theme.spaces.horizontal,
            paddingRight: insets.right + theme.spaces.horizontal,
            paddingBottom: theme.spaces.lg,
          }}
        />
      )}
      <Animated.View
        style={[
          {
            flex: 1,
            paddingLeft: insets.left + theme.spaces.horizontal,
            paddingRight: insets.right + theme.spaces.horizontal,
          },
          containerStyle,
          animatedContainerStyle,
        ]}
      >
        {/* Absolutely filled so the step on its way out and the one coming in
            overlap instead of sharing the column, which would halve both
            boxes for the length of the crossfade. */}
        <Animated.View
          key={currentStepKey}
          entering={FadeIn.duration(theme.animations.durations.xl).reduceMotion(
            ReduceMotion.System,
          )}
          exiting={FadeOut.duration(theme.animations.durations.md).reduceMotion(
            ReduceMotion.System,
          )}
          style={StyleSheet.absoluteFill}
        >
          {children}
        </Animated.View>
      </Animated.View>

      <FloatingFooter style={footerStyle}>
        {canGoBack && onBack && (
          <Button
            variant="muted"
            icon={Icons.ChevronLeft}
            size="lg"
            onPress={onBack}
            disabled={isLoading}
          />
        )}

        <Button
          icon={nextIcon}
          iconPosition="right"
          onPress={onNext}
          loading={isLoading}
          disabled={isNextDisabled}
          size="lg"
          containerStyle={tw`w-full shrink`}
        >
          {nextLabel}
        </Button>
      </FloatingFooter>
    </>
  );
};
