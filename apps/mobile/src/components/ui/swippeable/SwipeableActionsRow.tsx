import { ReactNode, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { IconName } from '@expo/ui';
import { Host, Icon as NativeIcon } from '@expo/ui';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../../../providers/ThemeProvider';
import { extractStyleKeys } from '../../../utils/extract-style-keys';
import { Text } from '../text';
import { AnimatedPressable } from '../AnimatedPressable';
import tw from '../../../lib/tw';

interface OpenRowHandle {
  close: () => void;
}
const openRows = new Set<OpenRowHandle>();

function closeOtherRows(self: OpenRowHandle) {
  for (const row of openRows) {
    if (row !== self) row.close();
  }
}

export interface SwipeAction {
  label: string;
  /** Platform-native icon - see `constants/native-icons.ts`. */
  icon: IconName;
  onPress: () => void;
  /** @default colors.destructive */
  iconColor?: {
    color: string;
    backgroundColor: string;
  };
  labelStyle?: {
    color?: string;
  };
  /** Final, fully-revealed width of this action. @default 76 */
  width?: number;
}

interface SwipeableActionsRowProps {
  children: ReactNode;
  /** Right-side actions, revealed as the row is swiped LEFT - the first
   * one (closest to the edge) reaches its own full width before the next
   * one starts growing. */
  actionsRight?: SwipeAction[];
  /** Left-side actions, revealed as the row is swiped RIGHT - same
   * growth order as `actionsRight`, just mirrored. */
  actionsLeft?: SwipeAction[];
  style?: ViewStyle;
  /** Corner radius the row settles into once the swipe has started. */
  borderRadius?: number;
}

const DEFAULT_ACTION_WIDTH = 76;
const ACTION_ICON_SIZE = 16;
const BACKGROUND_FADE_IN_DURATION = 300;
const BACKGROUND_FADE_OUT_DURATION = 150;
// Tuned to match react-native-gesture-handler's own ReanimatedSwipeable: a
// stiff, non-bouncy spring that still inherits the release velocity (passed
// per-call below) so it continues in the direction of the swipe.
const SPRING_CONFIG = { mass: 2, damping: 1000, stiffness: 700, overshootClamping: true };
// Same trick as that component's DRAG_TOSS: a fast, short flick never travels
// far enough to cross the threshold on distance alone, so a slice of the
// release velocity is folded into the decision.
const DRAG_TOSS = 0.05;
// UIKit's rubber-banding formula, f(x,d,c) = x*d*c / (d+c*x). Lets the row keep
// moving past fully-open with resistance instead of hard-stopping there.
const OVERSHOOT_DIMENSION = 40;
const OVERSHOOT_CONSTANT = 0.55;
// Fraction of a side's width the drag must cross (before the velocity toss is
// added) to count as open. Below half, so a lighter swipe commits.
const OPEN_THRESHOLD_FRACTION = 0.35;
const CONTENT_BUMP_VELOCITY_RANGE = [300, 1400];
const CONTENT_BUMP_MAX_DISTANCE = 16;

function rubberBand(overshoot: number) {
  'worklet';
  return (
    (overshoot * OVERSHOOT_DIMENSION * OVERSHOOT_CONSTANT) /
    (OVERSHOOT_DIMENSION + OVERSHOOT_CONSTANT * overshoot)
  );
}

// An empty side must resolve to a total width of exactly 0, not just the edge
// inset - otherwise that inset alone gives the gesture a real distance to
// settle "open" into, with nothing in it to show.
function getSideGeometry(sideActions: SwipeAction[], edgeInset: number, gap: number) {
  if (sideActions.length === 0) {
    return { widths: [], totalWidth: 0, revealStarts: [] };
  }
  const widths = sideActions.map((action) => action.width ?? DEFAULT_ACTION_WIDTH);
  const totalWidth =
    widths.reduce((sum, width) => sum + width, 0) +
    gap * Math.max(0, sideActions.length - 1) +
    edgeInset;
  const revealStarts = widths.map((_, index) => {
    const widthsBefore = widths.slice(0, index).reduce((sum, width) => sum + width, 0);
    return edgeInset + widthsBefore + gap * index;
  });
  return { widths, totalWidth, revealStarts };
}

/**
 * iOS Mail/Notes-style swipeable row: a muted, rounded backdrop fades in the
 * instant the swipe starts, and each action in `actionsRight`/`actionsLeft`
 * pops in one after another as the row keeps sliding.
 */
export const SwipeableActionsRow = ({
  children,
  actionsRight = [],
  actionsLeft = [],
  style,
  borderRadius: borderRadiusProp,
}: SwipeableActionsRowProps) => {
  const { colors, theme } = useTheme();
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const velocityX = useSharedValue(0);
  const borderRadius = borderRadiusProp ?? theme.border.radius.xl;

  const { extracted: contentPadding, restStyle: containerStyle } = extractStyleKeys(style, [
    'paddingHorizontal',
    'paddingLeft',
    'paddingRight',
  ]);
  // Each action layer is absolutely positioned behind the content, so it does
  // not inherit the content's horizontal padding - without this, the outermost
  // action would sit flush against the screen edge instead of matching the
  // margin the swiped item has everywhere else.
  const rightEdgeInset =
    (typeof contentPadding.paddingRight === 'number' ? contentPadding.paddingRight : undefined) ??
    (typeof contentPadding.paddingHorizontal === 'number'
      ? contentPadding.paddingHorizontal
      : undefined) ??
    0;
  const leftEdgeInset =
    (typeof contentPadding.paddingLeft === 'number' ? contentPadding.paddingLeft : undefined) ??
    (typeof contentPadding.paddingHorizontal === 'number'
      ? contentPadding.paddingHorizontal
      : undefined) ??
    0;

  const gap = theme.spaces.sm;
  const right = getSideGeometry(actionsRight, rightEdgeInset, gap);
  const left = getSideGeometry(actionsLeft, leftEdgeInset, gap);

  const backgroundVisible = useSharedValue(0);
  // Written in onEnd, read in onFinalize. onEnd only fires for a gesture that
  // actually activated; a plain press-and-release never does, so onFinalize is
  // the only handler guaranteed to run. Resolving the background there is what
  // lets it show immediately on press without getting stuck visible after a
  // tap that never became a swipe.
  const pendingOpenTarget = useSharedValue(0);

  const close = () => {
    translateX.value = withSpring(0, SPRING_CONFIG);
    pendingOpenTarget.value = 0;
    backgroundVisible.value = withTiming(0, { duration: BACKGROUND_FADE_OUT_DURATION });
  };

  // Kept fresh every render so the registry always calls the current `close`.
  // Reading `.current` during render is not allowed, so the effect is the only
  // safe place to write it.
  const latestCloseRef = useRef(close);
  useEffect(() => {
    latestCloseRef.current = close;
  });

  // Stable identity for this row's lifetime, via lazy state init rather than a
  // ref, so it is safe to read during render.
  const [self] = useState<OpenRowHandle>(() => ({ close: () => latestCloseRef.current() }));
  useEffect(() => {
    openRows.add(self);
    return () => {
      openRows.delete(self);
    };
  }, [self]);
  // Zero-arg on purpose: `self` is a JS-thread object holding a function, which
  // cannot cross as a scheduleOnRN argument from the UI-thread worklet below.
  const notifyOpened = () => {
    closeOtherRows(self);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      startX.value = translateX.value;
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutation
      backgroundVisible.value = withTiming(1, { duration: BACKGROUND_FADE_IN_DURATION });
    })
    .onUpdate((event) => {
      const raw = startX.value + event.translationX;
      if (raw < -right.totalWidth) {
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutation
        translateX.value = -right.totalWidth - rubberBand(-right.totalWidth - raw);
      } else if (raw > left.totalWidth) {
        translateX.value = left.totalWidth + rubberBand(raw - left.totalWidth);
      } else {
        translateX.value = raw;
      }
      velocityX.value = event.velocityX;
    })
    .onEnd((event) => {
      const tossedTranslate = translateX.value + DRAG_TOSS * event.velocityX;
      let target = 0;
      if (tossedTranslate < 0 && -tossedTranslate > right.totalWidth * OPEN_THRESHOLD_FRACTION) {
        target = -right.totalWidth;
      } else if (
        tossedTranslate > 0 &&
        tossedTranslate > left.totalWidth * OPEN_THRESHOLD_FRACTION
      ) {
        target = left.totalWidth;
      }
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutation
      pendingOpenTarget.value = target;
      if (target !== 0) {
        scheduleOnRN(notifyOpened);
      }

      const bumpDistance = interpolate(
        Math.abs(event.velocityX),
        CONTENT_BUMP_VELOCITY_RANGE,
        [0, CONTENT_BUMP_MAX_DISTANCE],
        Extrapolation.CLAMP,
      );
      if (bumpDistance > 0) {
        // A quick push past the resting point then a spring back, since the
        // settle spring is overshoot-clamped and never passes its target.
        const bumpTarget = target + Math.sign(event.velocityX) * bumpDistance;
        // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutation
        translateX.value = withSequence(
          withTiming(bumpTarget, { duration: 90 }),
          withSpring(target, SPRING_CONFIG),
        );
      } else {
        translateX.value = withSpring(target, { ...SPRING_CONFIG, velocity: event.velocityX });
      }
    })
    .onFinalize(() => {
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value mutation
      backgroundVisible.value = withTiming(pendingOpenTarget.value !== 0 ? 1 : 0, {
        duration: BACKGROUND_FADE_OUT_DURATION,
      });
    });

  const translateStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => {
    const revealed = backgroundVisible.value;
    return {
      borderRadius: revealed * borderRadius,
      backgroundColor: interpolateColor(revealed, [0, 1], [colors.background, colors.muted]),
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.actionsLeft, { gap, paddingLeft: leftEdgeInset }]}>
        {actionsLeft.map((action, index) => (
          <SwipeActionButton
            key={index}
            action={action}
            translateX={translateX}
            velocityX={velocityX}
            direction={1}
            revealStart={left.revealStarts[index]}
            onPress={() => {
              action.onPress();
              close();
            }}
          />
        ))}
      </View>
      <View style={[styles.actionsRight, { gap, paddingRight: rightEdgeInset }]}>
        {actionsRight
          .map((action, index) => ({ action, index }))
          .reverse()
          .map(({ action, index }) => (
            <SwipeActionButton
              key={index}
              action={action}
              translateX={translateX}
              velocityX={velocityX}
              direction={-1}
              revealStart={right.revealStarts[index]}
              onPress={() => {
                action.onPress();
                close();
              }}
            />
          ))}
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={translateStyle}>
          <Animated.View
            style={[styles.contentBackground, { left: gap, right: gap }, backgroundStyle]}
          />
          <View style={contentPadding}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const PILL_HEIGHT = 28;
const BUMP_VELOCITY_RANGE = [0, 1400];
// Always-visible floor for the bump, however slow the swipe.
const MIN_BUMP_SCALE = 1.015;
// Fraction of the vertical padding headroom the bump may use at top velocity.
const BUMP_INTENSITY = 0.3;
// A finger wobbles a few px around a single threshold while dragging, which
// re-fired the bump on every wobble and restarted its animation mid-flight.
// Two thresholds instead: crossing revealEnd + margin fires and disarms it,
// retracting past revealEnd - margin re-arms it.
const BUMP_ARM_MARGIN = 6;

const SwipeActionButton = ({
  action,
  translateX,
  velocityX,
  direction,
  revealStart,
  onPress,
}: {
  action: SwipeAction;
  translateX: SharedValue<number>;
  velocityX: SharedValue<number>;
  /** 1 for a left-side action (uncovered by +translateX), -1 for a
   * right-side one (uncovered by -translateX). */
  direction: 1 | -1;
  revealStart: number;
  onPress: () => void;
}) => {
  const { colors, theme } = useTheme();
  const width = action.width ?? DEFAULT_ACTION_WIDTH;
  const revealEnd = revealStart + width;

  const verticalPadding = theme.spaces.sm;
  const maxBumpScale = 1 + ((verticalPadding * 2) / PILL_HEIGHT) * BUMP_INTENSITY;
  const bumpScale = useSharedValue(1);
  const armed = useSharedValue(true);

  useAnimatedReaction(
    () => direction * translateX.value,
    (uncoveredPos) => {
      'worklet';
      if (armed.value && uncoveredPos >= revealEnd + BUMP_ARM_MARGIN) {
        armed.value = false;
        const bump = interpolate(
          Math.abs(velocityX.value),
          BUMP_VELOCITY_RANGE,
          [MIN_BUMP_SCALE, maxBumpScale],
          Extrapolation.CLAMP,
        );
        bumpScale.value = withSequence(
          withTiming(bump, { duration: 90 }),
          withSpring(1, { damping: 12, stiffness: 220 }),
        );
      } else if (!armed.value && uncoveredPos <= revealEnd - BUMP_ARM_MARGIN) {
        armed.value = true;
      }
    },
  );

  const style = useAnimatedStyle(() => {
    const uncovered = direction * translateX.value - revealStart;
    const scale = interpolate(uncovered, [width / 2, width], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(uncovered, [width * 0.7, width], [0, 1], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ scale: scale * bumpScale.value }],
    };
  });

  return (
    <View style={[styles.actionSlot, { width }]}>
      <AnimatedPressable onPress={onPress} style={tw`w-full`}>
        <Animated.View style={[styles.actionContent, { paddingVertical: verticalPadding }, style]}>
          <View
            style={[
              styles.actionPill,
              { backgroundColor: action.iconColor?.backgroundColor ?? colors.destructive },
            ]}
          >
            <Host style={{ width: ACTION_ICON_SIZE, height: ACTION_ICON_SIZE }}>
              <NativeIcon
                name={action.icon}
                size={ACTION_ICON_SIZE}
                color={action.iconColor?.color ?? colors.destructiveForeground}
              />
            </Host>
          </View>
          <Text
            style={[
              styles.actionLabel,
              { color: action.labelStyle?.color ?? colors.mutedForeground },
            ]}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </Animated.View>
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  contentBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  actionsRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row',
  },
  actionsLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
  },
  actionSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionPill: {
    width: '100%',
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
  },
});
