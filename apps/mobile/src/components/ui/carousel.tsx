import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  Extrapolation,
  ReduceMotion,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../../providers/ThemeProvider';
import tw from '../../lib/tw';

const AUTO_PLAY_INTERVAL = 6000;
// A tap on a dot is a direct action and stays quick. The autoplay crossfade is
// ambient -- nobody is waiting on it -- so it gets to be slow and soft, which
// is why it is allowed past the 300ms that applies to UI the user is waiting for.
const TRANSITION_DURATION = 300;
const AUTO_PLAY_TRANSITION_DURATION = 900;
// Items crossfade in place; they only drift this far, so the eye follows the
// fade rather than a slide.
const ITEM_SHIFT = 24;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
// A short flick never travels far enough on distance alone, so part of the
// release velocity is folded into the decision.
const DRAG_TOSS = 0.12;
const DOT_SIZE = 6;
const ACTIVE_DOT_WIDTH = 28;
const DOT_GAP = 5;
// The dot is 6px; the press target has to reach 44.
const DOT_HIT_SLOP = { top: 19, bottom: 19, left: DOT_GAP, right: DOT_GAP };
// Only the current item and its two neighbours are mounted: a crossfade needs
// both sides of the transition alive, and nothing else.
const RENDER_WINDOW = 1;

/**
 * Distance from `progress` to `index`, taking the short way around the loop.
 * Exported so an item can derive its own motion (parallax, scale) from the
 * carousel position and stay correct across the wrap from the last slide to the
 * first, where a plain `progress - index` jumps.
 */
export function slideDelta(progress: number, index: number, count: number) {
  'worklet';
  const half = count / 2;
  return ((((progress - index + half) % count) + count) % count) - half;
}

export interface CarouselRenderItemInfo<T> {
  item: T;
  index: number;
  /** Continuous carousel position, in index units. Pair with `slideDelta`. */
  progress: SharedValue<number>;
  count: number;
}

export interface CarouselProps<T> {
  data: T[];
  renderItem: (info: CarouselRenderItemInfo<T>) => ReactNode;
  height: number;
  width?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  /** Crossfade length when the carousel advances on its own. */
  autoPlayTransitionDuration?: number;
  /** Crossfade length for a tap on a pagination dot. */
  transitionDuration?: number;
  /** How far an item drifts sideways across a transition, in px. */
  itemShift?: number;
  paginationEnabled?: boolean;
  onIndexChange?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Carousel<T>({
  data,
  renderItem,
  height,
  width: widthProp,
  autoPlay = true,
  autoPlayInterval = AUTO_PLAY_INTERVAL,
  autoPlayTransitionDuration = AUTO_PLAY_TRANSITION_DURATION,
  transitionDuration = TRANSITION_DURATION,
  itemShift = ITEM_SHIFT,
  paginationEnabled = true,
  onIndexChange,
  style,
  contentStyle,
}: CarouselProps<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const width = widthProp ?? screenWidth;
  const count = data.length;
  const reducedMotion = useReducedMotion();

  // Continuous position in index units, so a drag and the pagination pill both
  // read the same value mid-transition.
  const progress = useSharedValue(0);
  const dragStart = useSharedValue(0);
  const activeIndexValue = useSharedValue(0);
  // The pair a non-gesture transition runs between. `transitionFrom` is -1 while
  // dragging, which puts the items back on the continuous reading of `progress`.
  const transitionFrom = useSharedValue(-1);
  const transitionTo = useSharedValue(0);
  // 0 -> 1 across one interval; the settled pagination dot fills with it.
  const autoPlayProgress = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Kept so a far target stays mounted for the whole crossfade; the render
  // window alone only covers the current item's neighbours.
  const [target, setTarget] = useState(0);
  // Wall-clock bookkeeping for the countdown, read and written in effects only.
  const consumedRef = useRef(0);
  const startedAtRef = useRef(0);

  // The only React state a landing writes; everything else derives from it in
  // the effect below, so there is one source of truth for "which slide".
  const settle = useCallback(
    (index: number) => {
      const normalized = ((index % count) + count) % count;
      setActiveIndex(normalized);
      onIndexChange?.(normalized);
    },
    [count, onIndexChange],
  );

  const goTo = useCallback(
    (
      target: number,
      velocity?: number,
      duration = transitionDuration,
      from = activeIndexValue.get(),
    ) => {
      // Any distance crossfades between exactly two items, so tapping a far dot
      // looks like tapping the one next door instead of racing through the ones
      // in between. The pair starts at the index being left, never at the
      // current position: releasing a half-finished drag has to carry on from
      // where the finger left it rather than replay the fade from zero.
      transitionFrom.set(Math.round(from));
      transitionTo.set(target);
      setTarget(((target % count) + count) % count);
      const config = { duration, easing: EASE_OUT };
      const land = () => settle(target);
      if (velocity === undefined) {
        progress.set(withTiming(target, config, (finished) => finished && scheduleOnRN(land)));
      } else {
        // A finger was involved, so the settle carries its velocity through.
        progress.set(
          withSpring(
            target,
            { duration: 400, dampingRatio: 0.9, velocity, overshootClamping: true },
            (finished) => finished && scheduleOnRN(land),
          ),
        );
      }
    },
    [activeIndexValue, count, progress, settle, transitionDuration, transitionFrom, transitionTo],
  );

  // Shared values only, so this is safe in an effect. Setting `progress` to the
  // landed index also normalises the loop wrap: `goTo(count)` lands past the
  // end and this brings it back to 0, which reads identically because the item
  // styles use the looped distance.
  useEffect(() => {
    progress.set(activeIndex);
    activeIndexValue.set(activeIndex);
    // Back to the continuous reading now that nothing is in flight; leaving the
    // pair set would misread the wrap, where the landed index is not the target.
    transitionFrom.set(-1);
    // Reset only: the effect below owns starting the fill, so the fill and the
    // timer can never be started from two different places.
    autoPlayProgress.set(0);
    consumedRef.current = 0;
  }, [activeIndex, activeIndexValue, autoPlayProgress, progress, transitionFrom]);

  // One owner for the countdown: the dot's fill and the timer that advances the
  // slide are started from the same remaining duration, so the dot can never
  // read full while there is still time left. The timer lives in the effect
  // rather than a ref, so the gesture pauses it through state instead of
  // reaching for `.current` during render.
  useEffect(() => {
    if (!autoPlay || count < 2) return;
    if (paused) {
      // Freeze the fill where it stands and bank the time spent. The elapsed
      // share cannot be read back off the shared value: the animation runs on
      // the UI thread, and assigning `withTiming` leaves the JS-side copy
      // sitting on the target, so `.get()` here would report a finished
      // countdown. Hence the wall clock.
      consumedRef.current += Date.now() - startedAtRef.current;
      cancelAnimation(autoPlayProgress);
      return;
    }
    const remaining = Math.max(autoPlayInterval - consumedRef.current, 0);
    startedAtRef.current = Date.now();
    autoPlayProgress.set(
      withTiming(1, {
        duration: remaining,
        easing: Easing.linear,
        // The fill is the information, not decoration: dropping it under
        // reduced motion would leave the dot saying nothing.
        reduceMotion: ReduceMotion.Never,
      }),
    );
    const timer = setTimeout(
      () => goTo(activeIndex + 1, undefined, autoPlayTransitionDuration),
      remaining,
    );
    return () => clearTimeout(timer);
  }, [
    activeIndex,
    autoPlay,
    autoPlayInterval,
    autoPlayProgress,
    autoPlayTransitionDuration,
    count,
    goTo,
    paused,
  ]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-24, 24])
    .onBegin(() => {
      dragStart.set(progress.get());
      transitionFrom.set(-1);
      scheduleOnRN(setPaused, true);
    })
    .onUpdate((event) => {
      // A full-width drag is worth one slide; the items themselves still only
      // move ITEM_SHIFT, so the gesture reads through the fade.
      progress.set(dragStart.get() - event.translationX / width);
    })
    .onEnd((event) => {
      const tossed = progress.get() - (event.velocityX / width) * DRAG_TOSS;
      const from = Math.round(dragStart.get());
      const target = Math.max(Math.min(Math.round(tossed), from + 1), from - 1);
      scheduleOnRN(goTo, target, -event.velocityX / width, undefined, from);
    })
    .onFinalize(() => {
      scheduleOnRN(setPaused, false);
    });

  if (count === 0) return null;

  return (
    <View style={style}>
      <GestureDetector gesture={pan}>
        {/* Not clipped: items are exactly container-sized, so nothing needs it,
            and an item that deliberately overflows -- a backdrop stretching on
            overscroll, say -- has to be allowed to spill. Override through
            `contentStyle` if a consumer wants clipping. */}
        <View style={[{ width, height, overflow: 'visible' }, contentStyle]}>
          {data.map((item, index) => {
            const distance = Math.min(
              Math.abs(index - activeIndex),
              count - Math.abs(index - activeIndex),
            );
            if (distance > RENDER_WINDOW && index !== target) return null;
            return (
              <CarouselItem
                key={index}
                index={index}
                count={count}
                progress={progress}
                transitionFrom={transitionFrom}
                transitionTo={transitionTo}
                isActive={index === activeIndex}
                shift={reducedMotion ? 0 : itemShift}
              >
                {renderItem({ item, index, progress, count })}
              </CarouselItem>
            );
          })}
        </View>
      </GestureDetector>
      {paginationEnabled && count > 1 && (
        <View style={[tw`flex-row items-center justify-center`, { gap: DOT_GAP, marginTop: 10 }]}>
          {data.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              count={count}
              progress={progress}
              autoPlayProgress={autoPlayProgress}
              activeIndex={activeIndexValue}
              onPress={() => goTo(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const CarouselItem = ({
  index,
  count,
  progress,
  transitionFrom,
  transitionTo,
  isActive,
  shift,
  children,
}: {
  index: number;
  count: number;
  progress: SharedValue<number>;
  transitionFrom: SharedValue<number>;
  transitionTo: SharedValue<number>;
  isActive: boolean;
  shift: number;
  children: ReactNode;
}) => {
  const style = useAnimatedStyle(() => {
    const from = transitionFrom.get();
    let delta: number;
    if (from < 0) {
      // Dragging: the finger drives the position directly.
      delta = slideDelta(progress.get(), index, count);
    } else {
      // A transition is running. Both items are mapped onto one unit of travel
      // whatever the real distance, so every jump fades like an adjacent one.
      const to = transitionTo.get();
      const span = to - from;
      const t = span === 0 ? 1 : Math.min(Math.max((progress.get() - from) / span, 0), 1);
      // The pair is direction-aware: going back, the incoming item has to enter
      // from the left and the outgoing one leave to the right. Without this the
      // sideways drift mirrors the instant a backwards drag is released.
      const direction = Math.sign(span);
      const isTo = (((index - to) % count) + count) % count === 0;
      const isFrom = (((index - from) % count) + count) % count === 0;
      delta = isTo ? -direction * (1 - t) : isFrom ? direction * t : 2;
    }
    return {
      opacity: interpolate(Math.abs(delta), [0, 1], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(delta, [-1, 0, 1], [shift, 0, -shift], Extrapolation.CLAMP) },
      ],
    };
  });

  // Touches are routed by the settled index rather than by a threshold on the
  // animation: a mid-transition flip is what put a step in the crossfade.
  return (
    <Animated.View
      pointerEvents={isActive ? 'auto' : 'none'}
      style={[StyleSheet.absoluteFill, style]}
    >
      {children}
    </Animated.View>
  );
};

const PaginationDot = ({
  index,
  count,
  progress,
  autoPlayProgress,
  activeIndex,
  onPress,
}: {
  index: number;
  count: number;
  progress: SharedValue<number>;
  autoPlayProgress: SharedValue<number>;
  activeIndex: SharedValue<number>;
  onPress: () => void;
}) => {
  const { colors, theme } = useTheme();

  const trackStyle = useAnimatedStyle(() => {
    const active = interpolate(
      Math.abs(slideDelta(progress.get(), index, count)),
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { width: interpolate(active, [0, 1], [DOT_SIZE, ACTIVE_DOT_WIDTH]) };
  });

  // Gated on the settled index, not on `progress`: the dot being swiped towards
  // shows an empty track and only starts filling once the carousel lands on it.
  const fillStyle = useAnimatedStyle(() => {
    if (activeIndex.get() !== index) return { width: 0, opacity: 0 };
    const active = interpolate(
      Math.abs(slideDelta(progress.get(), index, count)),
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP,
    );
    const trackWidth = interpolate(active, [0, 1], [DOT_SIZE, ACTIVE_DOT_WIDTH]);
    return { width: trackWidth * autoPlayProgress.get(), opacity: active };
  });

  return (
    <Pressable onPress={onPress} hitSlop={DOT_HIT_SLOP}>
      <Animated.View
        style={[
          {
            height: DOT_SIZE,
            backgroundColor: colors.muted,
            borderRadius: theme.border.radius.full,
            overflow: 'hidden',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              backgroundColor: colors.primary,
              borderRadius: theme.border.radius.full,
            },
            fillStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};
