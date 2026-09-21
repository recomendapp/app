import React, { useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Icons } from '../../constants/Icons';
import { useTheme } from '../../providers/ThemeProvider';
import { scheduleOnRN } from 'react-native-worklets';
import { LucideProps } from 'lucide-react-native';
import Svg from 'react-native-svg';
import { useSplashScreen } from '../../providers/SplashScreenProvider';

export const Logo = React.forwardRef<Svg, LucideProps>((props: LucideProps, ref) => {
  const { colors } = useTheme();
  const width = 70;
  return <Icons.app.icon ref={ref} color={props.fill || colors.accentYellow} width={width} />;
});
Logo.displayName = 'Logo';

export function Splash({ children }: React.PropsWithChildren) {
  const { isReady: isReadyContext, state, hideNativeSplash } = useSplashScreen();
  const { colors } = useTheme();
  const [isAnimationComplete, setIsAnimationComplete] = React.useState(false);
  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(1);
  const isReady = isReadyContext;

  const splashAnimation = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const logoAnimation = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.get() }],
  }));
  const onFinish = useCallback(() => setIsAnimationComplete(true), []);
  const onLayout = useCallback(() => hideNativeSplash(), [hideNativeSplash]);

  useEffect(() => {
    logoScale.set(
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.94, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );

    return () => cancelAnimation(logoScale);
  }, [logoScale]);

  useEffect(() => {
    if (!isReady || state !== 'finished' || isAnimationComplete) return;

    // `children` are mounted in the same committed render as `isReady`.
    // Effects run afterward, so the app is already behind this overlay when it fades.
    opacity.set(() =>
      withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
        scheduleOnRN(onFinish);
      }),
    );
  }, [isAnimationComplete, isReady, onFinish, opacity, state]);

  return (
    <>
      {isReady && children}

      {!isAnimationComplete && (
        <Animated.View
          onLayout={onLayout}
          style={[
            StyleSheet.absoluteFill,
            splashAnimation,
            {
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.background,
            },
          ]}
        >
          <Animated.View style={logoAnimation}>
            <Logo fill={colors.accentYellow} />
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}
