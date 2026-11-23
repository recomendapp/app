import type { ComponentRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import { Text } from './text';
import { useTheme } from '../../providers/ThemeProvider';

/**
 * Controlled, with no internal copy of the digits: the auth screens clear the
 * code after *every* verify so a wrong one can be retyped, and an internal
 * copy would leave that clear nothing to act on - stale digits stay on screen
 * and the `onComplete` guard then refuses to fire, locking sign-in.
 */
export interface InputOTPProps {
  /** Number of OTP digits. */
  length?: number;
  value: string;
  /** The digits, not a native change event - this component does not extend
   * `TextInputProps`, so there is no `onChange` to collide with. */
  onChange: (value: string) => void;
  /** Fired once, on the transition to a full code. */
  onComplete?: (value: string) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const InputOTP = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  accessibilityLabel,
}: InputOTPProps) => {
  const t = useTranslations();
  const { colors, theme } = useTheme();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    const filled = value.length / length;
    if (reducedMotion) {
      progress.set(filled);
      return;
    }

    progress.set(
      value.length === length
        ? withSpring(1, { damping: 12, stiffness: 260 })
        : withTiming(filled, { duration: 180, easing: Easing.out(Easing.cubic) }),
    );
  }, [value.length, length, progress, reducedMotion]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.get(), [0, 1], [0, -3]) },
      { scale: interpolate(progress.get(), [0, 0.9, 1], [1, 1, reducedMotion ? 1 : 1.025]) },
    ],
  }));

  const underlineStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [colors.border, colors.accentYellow]),
    transform: [{ scaleX: Math.max(0.08, progress.get()) }],
  }));

  const updateCode = (text: string) => {
    // Autofill and paste arrive as one whole string, so sanitize every time.
    const next = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(next);
    if (next.length === length && value.length !== length) {
      onComplete?.(next);
    }
  };

  return (
    <View style={[styles.root, disabled && styles.rootDisabled]}>
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={() => inputRef.current?.focus()}
        disabled={disabled}
      >
        <Animated.View style={[styles.row, { gap: theme.spaces.md }, rowStyle]}>
          {Array.from({ length }, (_, index) => {
            const digit = value[index] ?? '';
            const active = !disabled && focused && index === Math.min(value.length, length - 1);

            return (
              <LinearGradient
                key={index}
                colors={[colors.card, colors.background]}
                style={[
                  styles.slot,
                  {
                    borderRadius: theme.border.radius.lg,
                    borderColor: digit === '' ? colors.border : colors.mutedForeground,
                  },
                  active && { borderColor: colors.accentYellow, borderWidth: 2 },
                ]}
              >
                {/* One or the other, never both: an empty `Text` still
                    occupies its line box, so rendering it alongside the
                    cursor made the slot centre the two stacked and pushed
                    the cursor below centre. */}
                {digit !== '' ? (
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: theme.fonts.sizes.xl,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {digit}
                  </Text>
                ) : active ? (
                  <View style={[styles.cursor, { backgroundColor: colors.accentYellow }]} />
                ) : null}
              </LinearGradient>
            );
          })}
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.underline, underlineStyle]} />

      <TextInput
        ref={inputRef}
        accessibilityLabel={accessibilityLabel ?? upperFirst(t('common.messages.otp'))}
        autoComplete="one-time-code"
        editable={!disabled}
        inputMode="numeric"
        keyboardType="number-pad"
        maxLength={length}
        onBlur={() => setFocused(false)}
        onChangeText={updateCode}
        onFocus={() => setFocused(true)}
        style={styles.input}
        textContentType="oneTimeCode"
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { alignSelf: 'center', paddingVertical: 12 },
  rootDisabled: { opacity: 0.5 },
  row: { flexDirection: 'row' },
  slot: {
    alignItems: 'center',
    borderWidth: 1,
    height: 55,
    justifyContent: 'center',
    width: 48,
  },
  cursor: { height: 24, width: 2 },
  underline: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 3,
    marginTop: 10,
    width: '100%',
  },
  input: {
    height: 1,
    opacity: 0.01,
    position: 'absolute',
    width: 1,
  },
});
