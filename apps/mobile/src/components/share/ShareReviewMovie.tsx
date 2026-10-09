import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from '../ui/view';
import tw from '../../lib/tw';
import { ImageWithFallback } from '../utils/ImageWithFallback';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { Text } from '../ui/text';
import { Icons } from '../../constants/Icons';
import { Button } from '../ui/Button';
import {
  BORDER_RADIUS,
  GAP,
  PADDING,
  PADDING_HORIZONTAL,
  PADDING_VERTICAL,
  SOCIAL_CARD_WIDTH,
} from '../../theme/globals';
import WheelSelector from '../ui/WheelSelector';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutDown,
  FadeOutRight,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { Image } from 'expo-image';
import { CaptureResult, ShareViewRef } from './type';
import { CircleIcon } from 'lucide-react-native';
import { cropImageRatio } from '../../utils/imageManipulator';
import { router } from 'expo-router';
import { ScaledCapture } from '../ui/ScaledCapture';
import { LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { clamp, upperFirst } from 'lodash';
import { useImagePalette } from '../../hooks/useImagePalette';
import Color from 'color';
import { getTmdbImage } from '../../lib/tmdb/getTmdbImage';
import { MovieCompact, MovieImage, ReviewMovie, UserSummary } from '@libs/api-js';
import { useInfiniteQuery } from '@tanstack/react-query';
import { movieImagesInfiniteOptions } from '@libs/query-client';
import UserAvatar from '../user/UserAvatar';
import Switch from '../ui/Switch';
import { useTranslations } from 'use-intl';
import { convert } from 'html-to-text';
import { formatCompactCount } from '../../utils/formatCompactCount';

interface ShareReviewMovieProps extends React.ComponentProps<typeof ViewShot> {
  movie: MovieCompact;
  review: ReviewMovie;
  author: UserSummary;
  rating?: number | null;
  variant?: 'default';
  isPremium?: boolean;
}

const ITEM_WIDTH = 64;
const ITEM_SPACING = 8;
// Below this, the card stops shrinking even if the review still overflows the box.
const MIN_FIT_SCALE = 0.5;

/* -------------------------------- VARIANTS -------------------------------- */
const RatingBadgeInline = ({ rating, scale }: { rating: number; scale: number }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        tw`items-center justify-center rounded-sm shrink-0`,
        {
          aspectRatio: 3 / 2,
          width: 24 * scale,
          backgroundColor: colors.accentYellowForeground,
          borderColor: colors.accentYellow,
          borderWidth: 1.5 * scale,
        },
      ]}
    >
      <Text style={[tw`font-bold`, { color: colors.accentYellow, fontSize: 9 * scale }]}>
        {rating % 1 === 0 ? rating : rating.toFixed(1)}
      </Text>
    </View>
  );
};

const ShareReviewMovieDefault = ({
  movie,
  review,
  author,
  rating,
  showLikes,
  showComments,
  scale = 1,
}: {
  movie: MovieCompact;
  review: ReviewMovie;
  author: UserSummary;
  rating?: number | null;
  showLikes: boolean;
  showComments: boolean;
  scale?: number;
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const year = useMemo(
    () => (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : undefined),
    [movie.releaseDate],
  );
  const bodyText = useMemo(
    () =>
      convert(review.body, {
        selectors: [{ selector: 'a', options: { ignoreHref: true } }],
      }),
    [review.body],
  );
  const title =
    review.title || upperFirst(t('common.messages.review_by', { name: author.username }));

  return (
    <View
      style={[
        tw`w-full`,
        {
          borderRadius: BORDER_RADIUS * scale,
          backgroundColor: Color(colors.muted).alpha(0.95).string(),
          gap: GAP * 0.6 * scale,
          padding: PADDING * 0.85 * scale,
        },
      ]}
    >
      <View style={tw`items-center`}>
        <Text numberOfLines={2} style={[tw`font-bold text-center`, { fontSize: 12 * scale }]}>
          {movie.title}
        </Text>
        {year && (
          <Text textColor="muted" style={{ fontSize: 9 * scale }}>
            {year}
          </Text>
        )}
      </View>
      <View style={tw`flex-row items-center justify-between`}>
        <View style={[tw`flex-row items-center shrink`, { gap: 4 * scale }]}>
          <UserAvatar
            full_name={author.name}
            avatar_url={author.avatar}
            style={{ width: 16 * scale, height: 16 * scale }}
          />
          <Text
            numberOfLines={1}
            style={[tw`font-semibold shrink`, { color: colors.foreground, fontSize: 9 * scale }]}
          >
            {author.name || author.username}
          </Text>
        </View>
        {typeof rating === 'number' && rating !== null && (
          <RatingBadgeInline rating={rating} scale={scale} />
        )}
      </View>
      <View>
        <Text
          numberOfLines={2}
          style={[tw`font-bold text-center`, { color: colors.accentYellow, fontSize: 12 * scale }]}
        >
          {title}
        </Text>
        <Text style={[tw`text-justify`, { fontSize: 11 * scale, marginTop: 4 * scale }]}>
          {bodyText}
        </Text>
      </View>
      {(showLikes || showComments) && (
        <View style={[tw`flex-row items-center`, { gap: 8 * scale }]}>
          {showLikes && (
            <View style={[tw`flex-row items-center`, { gap: 3 * scale }]}>
              <Icons.like size={11 * scale} color={colors.mutedForeground} />
              <Text style={{ fontSize: 9 * scale, color: colors.mutedForeground }}>
                {formatCompactCount(review.likesCount)}
              </Text>
            </View>
          )}
          {showComments && (
            <View style={[tw`flex-row items-center`, { gap: 3 * scale }]}>
              <Icons.Comment size={11 * scale} color={colors.mutedForeground} />
              <Text style={{ fontSize: 9 * scale, color: colors.mutedForeground }}>
                {formatCompactCount(review.commentsCount)}
              </Text>
            </View>
          )}
        </View>
      )}
      <View style={tw`items-center`}>
        <Icons.app.logo color={colors.accentYellow} height={8 * scale} />
      </View>
    </View>
  );
};
/* -------------------------------------------------------------------------- */

/* --------------------------------- CUSTOM --------------------------------- */
const ColorSelector = ({
  colors,
  bgColor,
  setBgColor,
}: {
  colors: string[];
  bgColor: { index: number; color: string } | null;
  setBgColor: (color: { index: number; color: string } | null) => void;
}) => {
  const { colors: colorsTheme } = useTheme();

  const renderColorItem = useCallback(
    (item: string) => (
      <View
        style={[
          {
            backgroundColor: item,
            borderColor: colorsTheme.border,
          },
          tw`w-full aspect-square rounded-full overflow-hidden border-2`,
        ]}
      />
    ),
    [colorsTheme.border],
  );

  const handleColorSelection = useCallback(
    (item: string, index: number) => {
      setBgColor({ index, color: item });
    },
    [setBgColor],
  );

  const keyExtractor = useCallback((item: string, index: number) => index.toString(), []);
  return (
    <WheelSelector
      entering={FadeInDown}
      exiting={FadeOutDown}
      data={colors}
      renderItem={renderColorItem}
      keyExtractor={keyExtractor}
      onSelectionChange={handleColorSelection}
      initialIndex={bgColor?.index ?? 0}
      enableHaptics={true}
      itemWidth={ITEM_WIDTH}
      itemSpacing={ITEM_SPACING}
      wheelAngle={0}
      wheelIntensity={0.2}
    />
  );
};
const BackdropImageSelector = ({
  movieId,
  selectedBackdrop,
  setBackdrop,
  movieTitle,
}: {
  movieId: number;
  selectedBackdrop?: MovieImage;
  setBackdrop: (backdrop: MovieImage) => void;
  movieTitle: string;
}) => {
  const { data, hasNextPage, fetchNextPage } = useInfiniteQuery(
    movieImagesInfiniteOptions({
      movieId: movieId,
      filters: {
        type: 'backdrop',
      },
    }),
  );
  const backdrops = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);

  const renderBackdropItem = useCallback(
    (item: MovieImage) => (
      <ImageWithFallback
        source={{ uri: getTmdbImage({ path: item.filePath, size: 'w154' }) ?? '' }}
        alt={movieTitle}
        type="movie"
        style={{ aspectRatio: 2 / 3, width: ITEM_WIDTH }}
      />
    ),
    [movieTitle],
  );

  const handleBackdropSelection = useCallback(
    (item: MovieImage) => {
      setBackdrop(item);
    },
    [setBackdrop],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage) fetchNextPage();
  }, [hasNextPage, fetchNextPage]);

  const initialIndex = useMemo(() => {
    const isFind = backdrops.findIndex((p) => p.id === selectedBackdrop?.id);
    return isFind === -1 ? 0 : isFind;
  }, [backdrops, selectedBackdrop]);

  const keyExtractor = useCallback((item: MovieImage) => item.id.toString(), []);

  return (
    <WheelSelector
      entering={FadeInDown}
      exiting={FadeOutDown}
      data={backdrops}
      renderItem={renderBackdropItem}
      keyExtractor={keyExtractor}
      onSelectionChange={handleBackdropSelection}
      initialIndex={initialIndex}
      enableHaptics={true}
      itemWidth={ITEM_WIDTH}
      itemSpacing={ITEM_SPACING}
      wheelAngle={0}
      wheelIntensity={0.2}
      onEndReached={handleEndReached}
    />
  );
};

/* -------------------------------------------------------------------------- */

export const ShareReviewMovie = forwardRef<ShareViewRef, ShareReviewMovieProps>(
  ({ movie, review, author, rating, variant = 'default', isPremium, ...props }, ref) => {
    const viewShotRef = useRef<ViewShotRef>(null);
    const { height: screenHeight } = useWindowDimensions();
    const { colors } = useTheme();
    const t = useTranslations();
    const hasRating = typeof rating === 'number' && rating !== null;
    const [showRating, setShowRating] = useState(hasRating);
    const [showLikes, setShowLikes] = useState(review.likesCount > 0);
    const [showComments, setShowComments] = useState(review.commentsCount > 0);
    // States
    const [backdrop, setBackdrop] = useState<MovieImage | undefined>(undefined);
    const backdropUrl = useMemo(
      () =>
        backdrop
          ? getTmdbImage({ path: backdrop.filePath, size: 'w780' })
          : movie.backdropPath
            ? getTmdbImage({ path: movie.backdropPath, size: 'w780' })
            : undefined,
      [backdrop, movie.backdropPath],
    );
    const paletteSourceUrl = useMemo(
      () => (movie.posterPath ? getTmdbImage({ path: movie.posterPath, size: 'w342' }) : undefined),
      [movie.posterPath],
    );
    const { palette } = useImagePalette(paletteSourceUrl);
    const [bgColor, setBgColor] = useState<{ index: number; color: string } | null>(
      palette ? { index: 0, color: palette[0] } : null,
    );
    const [bgType, setBgType] = useState<'color' | 'image'>(
      isPremium && backdropUrl ? 'image' : 'color',
    );
    const [editing, setEditing] = useState(false);

    // Box layout: a fixed 9:16 box the card must fit inside.
    const boxHeight = clamp(400, screenHeight * 0.7);
    const boxWidth = boxHeight * (9 / 16);
    const availableHeight = boxHeight - PADDING_VERTICAL * 2;
    const contentWidth = boxWidth - PADDING_HORIZONTAL * 2;

    // Measures the card at scale=1 (invisibly) so it can be shrunk to fit availableHeight,
    // letting a long review always render in full without a numberOfLines cap.
    const [naturalHeight, setNaturalHeight] = useState(0);
    const handleNaturalLayout = useCallback((e: LayoutChangeEvent) => {
      setNaturalHeight(e.nativeEvent.layout.height);
    }, []);
    const fitScale = useMemo(() => {
      if (!naturalHeight || !availableHeight) return 1;
      return clamp(availableHeight / naturalHeight, MIN_FIT_SCALE, 1);
    }, [naturalHeight, availableHeight]);

    useImperativeHandle(ref, () => ({
      capture: async (options): Promise<CaptureResult> => {
        if (!viewShotRef.current) throw new Error('ViewShot ref is not available');
        const uri = await viewShotRef.current.capture?.();

        const backgroundImage =
          bgType === 'image' && backdropUrl
            ? await cropImageRatio(backdropUrl, options?.background?.ratio ?? 9 / 16)
            : undefined;

        return {
          sticker: uri,
          backgroundImage: backgroundImage?.uri,
          ...(bgType === 'color' && bgColor
            ? {
                backgroundTopColor: bgColor.color,
                backgroundBottomColor: bgColor.color,
              }
            : {}),
        };
      },
    }));

    const renderSticker = useCallback(
      (scale: number) => (
        <ShareReviewMovieDefault
          movie={movie}
          review={review}
          author={author}
          rating={showRating ? rating : undefined}
          showLikes={showLikes}
          showComments={showComments}
          scale={scale * fitScale}
        />
      ),
      [movie, review, author, showRating, rating, showLikes, showComments, fitScale],
    );

    const NaturalSizeMeasurement = useMemo(
      () => (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', opacity: 0, top: 0, left: -9999, width: contentWidth }}
          onLayout={handleNaturalLayout}
        >
          <ShareReviewMovieDefault
            movie={movie}
            review={review}
            author={author}
            rating={showRating ? rating : undefined}
            showLikes={showLikes}
            showComments={showComments}
            scale={1}
          />
        </View>
      ),
      [
        contentWidth,
        handleNaturalLayout,
        movie,
        review,
        author,
        showRating,
        rating,
        showLikes,
        showComments,
      ],
    );

    const handleEnableEditing = useCallback(() => {
      if (isPremium) {
        setEditing((v) => !v);
      } else {
        router.push('/upgrade');
      }
    }, [isPremium]);

    const EditButtons = useMemo(
      () => (
        <View style={[tw`absolute top-2 right-2 flex-row items-center`, { gap: GAP }]}>
          {editing && (
            <Animated.View
              entering={FadeInRight}
              exiting={FadeOutRight}
              style={[tw`flex-row items-center`, { gap: GAP }]}
            >
              {backdropUrl && (
                <Button
                  variant="muted"
                  icon={bgType === 'image' && bgColor ? CircleIcon : Icons.Image}
                  size="icon"
                  iconProps={bgType === 'image' && bgColor ? { fill: bgColor.color } : undefined}
                  onPress={() => setBgType((prev) => (prev === 'color' ? 'image' : 'color'))}
                  style={tw`rounded-full`}
                />
              )}
            </Animated.View>
          )}
          <Button
            variant="muted"
            icon={editing ? Icons.Check : Icons.Edit}
            size="icon"
            style={tw`rounded-full`}
            onPress={handleEnableEditing}
          />
        </View>
      ),
      [editing, backdropUrl, handleEnableEditing, bgType, bgColor],
    );

    const EditOptions = useMemo(() => {
      if (!editing) return null;
      const content =
        bgType === 'color' && palette ? (
          <ColorSelector colors={palette} bgColor={bgColor} setBgColor={setBgColor} />
        ) : backdropUrl ? (
          <BackdropImageSelector
            movieId={movie.id}
            selectedBackdrop={backdrop}
            setBackdrop={setBackdrop}
            movieTitle={movie.title ?? ''}
          />
        ) : null;
      if (!content) return null;
      return <View style={[tw`absolute w-full`, { bottom: PADDING_VERTICAL }]}>{content}</View>;
    }, [editing, bgType, palette, bgColor, backdropUrl, movie, backdrop]);

    const toggles = useMemo(
      () => [
        ...(hasRating
          ? [
              {
                key: 'rating',
                label: t('common.messages.share_my_rating'),
                value: showRating,
                onChange: setShowRating,
              },
            ]
          : []),
        ...(review.likesCount > 0
          ? [
              {
                key: 'likes',
                label: t('common.messages.show_likes_count'),
                value: showLikes,
                onChange: setShowLikes,
              },
            ]
          : []),
        ...(review.commentsCount > 0
          ? [
              {
                key: 'comments',
                label: t('common.messages.show_comments_count'),
                value: showComments,
                onChange: setShowComments,
              },
            ]
          : []),
      ],
      [hasRating, showRating, review.likesCount, showLikes, review.commentsCount, showComments, t],
    );

    const Toggles = useMemo(() => {
      if (toggles.length === 0) return null;
      return (
        <View style={{ gap: GAP }}>
          {toggles.map((toggle) => (
            <View
              key={toggle.key}
              style={[
                tw`flex-row items-center justify-between`,
                { paddingHorizontal: PADDING_HORIZONTAL, gap: GAP },
              ]}
            >
              <Text>{toggle.label}</Text>
              <Switch value={toggle.value} onValueChange={toggle.onChange} />
            </View>
          ))}
        </View>
      );
    }, [toggles]);

    // useEffects
    // Resets bgColor from the async palette; bgColor stays independently user-editable afterward.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
      if (palette) {
        setBgColor({ index: 0, color: palette[0] });
      } else {
        setBgColor(null);
      }
    }, [palette]);
    /* eslint-enable react-hooks/set-state-in-effect */

    return (
      <View style={{ gap: GAP }} {...props}>
        <View style={tw`items-center`}>
          <View
            style={[
              {
                aspectRatio: 9 / 16,
                paddingHorizontal: PADDING_HORIZONTAL,
                paddingVertical: PADDING_VERTICAL,
                borderRadius: BORDER_RADIUS,
                height: boxHeight,
                backgroundColor: colors.background,
              },
              tw`relative items-center justify-center overflow-hidden`,
            ]}
          >
            {bgType === 'image' && backdropUrl ? (
              <Image source={{ uri: backdropUrl }} style={tw`absolute inset-0`} />
            ) : (
              bgType === 'color' &&
              bgColor && <View style={[tw`absolute inset-0`, { backgroundColor: bgColor.color }]} />
            )}
            {NaturalSizeMeasurement}
            <ScaledCapture
              ref={viewShotRef}
              targetWidth={SOCIAL_CARD_WIDTH}
              renderContent={renderSticker}
              style={{ width: contentWidth }}
            />
            {EditButtons}
          </View>
          {EditOptions}
        </View>
        {Toggles}
      </View>
    );
  },
);
ShareReviewMovie.displayName = 'ShareReviewMovie';
