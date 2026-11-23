import React, { useMemo, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { Icons } from '../../constants/Icons';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';
import tw from '../../lib/tw';
import { Button } from './Button';
import { useTranslations } from 'use-intl';
import { useTheme } from '../../providers/ThemeProvider';

interface MultiStepScreenProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  currentStepKey?: string | number;

  onNext: () => void | Promise<void>;
  onBack?: () => void;
  canGoBack?: boolean;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  nextIcon?: any;
}

export const MultiStepScreen = ({
  children,
  contentContainerStyle,
  currentStepKey,
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

  /* ---------------------------------- Style & Animations --------------------------------- */
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const [footerHeight, setFooterHeight] = useState(0);

  const paddingBottom = useMemo(() => footerHeight, [footerHeight]);

  const paddingLeft = useMemo(() => insets.left + theme.spaces.horizontal, [insets.left, theme]);

  const paddingRight = useMemo(() => insets.right + theme.spaces.horizontal, [insets.right, theme]);

  const animatedFooterStyle = useAnimatedStyle(() => {
    const kbHeight = Math.abs(keyboardHeight.value);

    return {
      bottom: kbHeight,
      paddingBottom: (kbHeight > 0 ? 0 : insets.bottom) + theme.spaces.md,
    };
  });

  return (
    <>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          {
            paddingLeft: paddingLeft,
            paddingRight: paddingRight,
            paddingBottom: paddingBottom,
            gap: theme.spaces.md,
            flexGrow: 1,
          },
          contentContainerStyle,
        ]}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={footerHeight + theme.spaces.md}
      >
        <React.Fragment key={currentStepKey}>{children}</React.Fragment>
      </KeyboardAwareScrollView>

      <Animated.View
        onLayout={(e) => {
          setFooterHeight(e.nativeEvent.layout.height);
        }}
        style={[
          tw`absolute flex-row items-center justify-center left-0 right-0`,
          {
            gap: theme.spaces.md,
            paddingLeft: paddingLeft,
            paddingRight: paddingRight,
            paddingTop: theme.spaces.md,
          },
          animatedFooterStyle,
        ]}
      >
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
      </Animated.View>
    </>
  );
};
