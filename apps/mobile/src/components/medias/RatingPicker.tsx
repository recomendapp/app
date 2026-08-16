import { useTheme } from '../../providers/ThemeProvider';
import tw from '../../lib/tw';
import React, { useEffect, useMemo, useRef } from 'react';
import { Dimensions, FlatList, Pressable, TouchableOpacity } from 'react-native';
import Animated, {
  clamp,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { Icons } from '../../constants/Icons';

const { width } = Dimensions.get('screen');
const ITEM_WIDTH = width * 0.2;
const ITEM_SPACING = 8;
const ITEM_TOTAL_SIZE = ITEM_WIDTH + ITEM_SPACING;
// Size of the fixed selection slot the numbers scroll behind — see RatingPicker's overlay.
const SLOT_WIDTH = ITEM_WIDTH;
const SLOT_HEIGHT = ITEM_WIDTH * 0.75;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface RatingItemProps extends React.ComponentProps<typeof Animated.View> {
  index: number;
  rating: number;
  scrollX: SharedValue<number>;
}

const RatingItem = React.forwardRef<React.ComponentRef<typeof Animated.View>, RatingItemProps>(
  ({ index, rating, scrollX, ...props }, ref) => {
    const { colors } = useTheme();
    const anim = useAnimatedStyle(
      () => ({
        opacity: interpolate(scrollX?.get(), [index - 1, index, index + 1], [0.65, 1, 0.65]),
        transform: [
          {
            translateY: interpolate(
              scrollX?.get(),
              [index - 1, index, index + 1],
              [ITEM_WIDTH / 10, 0, ITEM_WIDTH / 10],
            ),
          },
        ],
      }),
      [scrollX],
    );
    // Progressively turns accentYellow as this digit approaches the fixed selection slot at
    // the center — fully yellow once it's the selected one, white the further away it scrolls.
    const textAnim = useAnimatedStyle(
      () => ({
        color: interpolateColor(
          scrollX?.get(),
          [index - 1, index, index + 1],
          ['white', colors.accentYellow, 'white'],
        ),
      }),
      [scrollX, colors.accentYellow],
    );
    return (
      <Animated.View
        ref={ref}
        style={[
          tw`relative rounded-full items-center justify-center`,
          { width: ITEM_WIDTH, height: ITEM_WIDTH },
          anim,
        ]}
        {...props}
      >
        <Animated.Text style={[tw`text-4xl font-bold`, textAnim]}>{rating}</Animated.Text>
      </Animated.View>
    );
  },
);
RatingItem.displayName = 'RatingItem';

interface RatingPickerProps {
  /** Initial value to scroll to on mount — not synced afterward (this is a controlled scroller).
   * Also drives the clear button's disabled state, reflecting whether a rating currently
   * exists. */
  rating?: number | null;
  /** Fires once the picker settles on a value (scroll end), not on every tick while scrolling —
   * safe to persist directly from this callback. */
  onRatingChange: (rating: number) => void;
  /** Fired by the clear button, between the two chevrons — disabled when `rating` is unset. */
  onClear: () => void;
}

/**
 * Inline, embeddable version of BottomSheetRating's number scroller — without the poster
 * preview or save/delete buttons, since callers (the log screens) persist on every change
 * themselves rather than through an explicit save action.
 */
export const RatingPicker = ({ rating, onRatingChange, onClear }: RatingPickerProps) => {
  const { colors } = useTheme();
  const scrollRef = useRef<FlatList>(null);
  const ratings = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({ id: i, rating: i + 1 })),
    [],
  );
  const defaultRating = Math.floor(ratings.length / 2);
  const activeRating = useSharedValue(rating ?? defaultRating);
  const scrollX = useSharedValue(0);
  // null (no rating yet) is a sentinel meaning "nothing committed" — so if the picker starts
  // out unrated, even settling back on the default value still counts as a real choice and
  // fires onRatingChange, instead of silently no-opping because it "didn't change".
  const lastCommittedRating = useRef<number | null>(rating ?? null);
  // The mount-time useEffect below silently jumps the list to its initial offset, which can
  // itself trigger onMomentumScrollEnd/onScrollEndDrag as a side effect — without this guard
  // that phantom scroll-end would commit the default rating before the user ever touched
  // anything. Only real interaction entry points (item tap, chevrons, drag start) set this.
  const hasInteracted = useRef(false);
  // One-shot flag consumed by the very next commitRating call — used by handleClear so the
  // scroll-back-to-default it triggers doesn't itself commit anything (see there).
  const suppressNextCommit = useRef(false);

  const vibrate = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const onScroll = useAnimatedScrollHandler((e) => {
    'worklet';
    scrollX.value = clamp(e.contentOffset.x / ITEM_TOTAL_SIZE, 0, ratings.length - 1);
    const newActiveRating = Math.round(scrollX.get()) + 1;
    if (newActiveRating !== activeRating.get()) {
      activeRating.value = newActiveRating;
      scheduleOnRN(vibrate);
    }
  });
  const commitRating = () => {
    if (!hasInteracted.current) return;
    if (suppressNextCommit.current) {
      suppressNextCommit.current = false;
      // Reflects the real state (nothing committed) rather than pretending defaultRating was
      // already chosen — otherwise a later tap directly on the default value would see no
      // diff against lastCommittedRating and silently no-op instead of committing it.
      lastCommittedRating.current = null;
      return;
    }
    if (activeRating.value !== lastCommittedRating.current) {
      lastCommittedRating.current = activeRating.value;
      onRatingChange(activeRating.value);
    }
  };

  const handleClear = () => {
    hasInteracted.current = true;
    // The scroll back to default is purely visual here (reusing the normal scroll-driven
    // animation — splash, color, haptics), so its own resulting commitRating call must not
    // turn "clear" into "set rating back to default".
    suppressNextCommit.current = true;
    scrollRef.current?.scrollToOffset({
      offset: (defaultRating - 1) * ITEM_TOTAL_SIZE,
      animated: true,
    });
    onClear();
  };

  const decreaseRatingStyle = useAnimatedStyle(() => ({
    opacity: activeRating.value === 1 ? 0.5 : 1,
  }));
  const decreaseDisabledProps = useAnimatedProps(() => ({
    disabled: activeRating.value === 1,
  }));
  const increaseRatingStyle = useAnimatedStyle(() => ({
    opacity: activeRating.value === ratings.length ? 0.5 : 1,
  }));
  const increaseDisabledProps = useAnimatedProps(() => ({
    disabled: activeRating.value === ratings.length,
  }));

  useEffect(() => {
    scrollRef.current?.scrollToOffset({
      offset: (activeRating.value - 1) * ITEM_TOTAL_SIZE,
      animated: false,
    });
    // activeRating is a SharedValue — its identity is stable across renders, so this still only
    // runs once (on mount, to position the list at the initial value) despite being listed.
  }, [activeRating]);

  return (
    <>
      {/*<Animated.View style={{ height: ITEM_WIDTH * 2 }}>*/}
      <Animated.View>
        <Animated.View
          pointerEvents="none"
          style={tw`absolute inset-0 items-center justify-center`}
        >
          {/* Centered via flexbox (not manual top/left math) so it stays correct regardless of
              the actual resolved height of the container around it. */}
          <Animated.View
            style={[
              tw`rounded-lg border-2`,
              {
                width: SLOT_WIDTH,
                height: SLOT_HEIGHT,
                backgroundColor: 'black',
                borderColor: colors.accentYellow,
              },
            ]}
          />
        </Animated.View>
        <Animated.FlatList
          ref={scrollRef}
          data={ratings}
          renderItem={({ item }) => (
            <Pressable
              key={item.id}
              onPress={() => {
                hasInteracted.current = true;
                if (item.rating === activeRating.value) {
                  commitRating();
                } else {
                  scrollRef.current?.scrollToOffset({
                    offset: item.id * ITEM_TOTAL_SIZE,
                    animated: true,
                  });
                }
              }}
            >
              <RatingItem index={item.id} rating={item.rating} scrollX={scrollX} />
            </Pressable>
          )}
          contentInsetAdjustmentBehavior={'never'}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            flexGrow: 0,
            // height: ITEM_WIDTH * 2,
          }}
          contentContainerStyle={{
            gap: ITEM_SPACING,
            paddingHorizontal: (width - ITEM_WIDTH) / 2,
          }}
          onScroll={onScroll}
          scrollEventThrottle={1000 / 60}
          snapToInterval={ITEM_TOTAL_SIZE}
          onScrollBeginDrag={() => {
            hasInteracted.current = true;
          }}
          onMomentumScrollEnd={commitRating}
          onScrollEndDrag={commitRating}
        />
      </Animated.View>
      <Animated.View style={[tw`flex-row items-center justify-center gap-4`]}>
        <AnimatedTouchableOpacity
          style={[
            { backgroundColor: colors.background },
            tw`rounded-full p-2`,
            decreaseRatingStyle,
          ]}
          animatedProps={decreaseDisabledProps}
          onPress={() => {
            hasInteracted.current = true;
            scrollRef.current?.scrollToOffset({
              offset: (activeRating.value - 2) * ITEM_TOTAL_SIZE,
              animated: true,
            });
          }}
        >
          <Icons.ChevronLeft color={colors.accentYellow} />
        </AnimatedTouchableOpacity>
        <TouchableOpacity
          style={[
            { backgroundColor: colors.background },
            tw`rounded-full p-2`,
            !rating && { opacity: 0.5 },
          ]}
          disabled={!rating}
          onPress={handleClear}
        >
          <Icons.X color={colors.accentYellow} />
        </TouchableOpacity>
        <AnimatedTouchableOpacity
          style={[
            { backgroundColor: colors.background },
            tw`rounded-full p-2`,
            increaseRatingStyle,
          ]}
          animatedProps={increaseDisabledProps}
          onPress={() => {
            hasInteracted.current = true;
            scrollRef.current?.scrollToOffset({
              offset: activeRating.value * ITEM_TOTAL_SIZE,
              animated: true,
            });
          }}
        >
          <Icons.ChevronRight color={colors.accentYellow} />
        </AnimatedTouchableOpacity>
      </Animated.View>
    </>
  );
};
