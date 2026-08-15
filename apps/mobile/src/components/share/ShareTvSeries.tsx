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
  HEIGHT,
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
import { CircleIcon, LucideIcon } from 'lucide-react-native';
import { cropImageRatio } from '../../utils/imageManipulator';
import { router } from 'expo-router';
import { ScaledCapture } from '../ui/ScaledCapture';
import { useWindowDimensions } from 'react-native';
import { clamp } from 'lodash';
import { useImagePalette } from '../../hooks/useImagePalette';
import Color from 'color';
import { ShapeVerticalRoundedBackground, ShapeVerticalRoundedForeground } from '../../lib/icons';
import { getTmdbImage } from '../../lib/tmdb/getTmdbImage';
import { TvSeriesCompact, TvSeriesImage } from '@libs/api-js';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { tvSeriesImagesInfiniteOptions, tvSeriesLogOptions } from '@libs/query-client';
import { useAuth } from '../../providers/AuthProvider';
import UserAvatar from '../user/UserAvatar';
import Switch from '../ui/Switch';
import { useTranslations } from 'use-intl';

interface ShareTvSeriesProps extends React.ComponentProps<typeof ViewShot> {
  tvSeries: TvSeriesCompact;
  variant?: 'default';
  isPremium?: boolean;
}

type EditType = 'poster' | 'background';

type EditOption = {
  value: EditType;
  icon: LucideIcon;
};

const ITEM_WIDTH = 64;
const ITEM_SPACING = 8;

const EditOptionsSelector = ({
  editOptions,
  activeEditingOption,
  setActiveEditingOption,
}: {
  editOptions: EditOption[];
  activeEditingOption: EditType;
  setActiveEditingOption: (value: EditType) => void;
}) => {
  const { colors } = useTheme();
  const renderEditItem = useCallback((item: EditOption, isActive: boolean) => {
    return (
      <View
        style={[
          tw`rounded-full items-center justify-center w-full aspect-square border`,
          {
            backgroundColor: colors.muted,
            borderColor: isActive ? colors.foreground : colors.border,
          },
        ]}
      >
        <item.icon size={20} color={colors.foreground} />
      </View>
    );
  }, []);

  const handleSelectionChange = useCallback(
    (item: EditOption) => {
      setActiveEditingOption(item.value);
    },
    [setActiveEditingOption],
  );

  const initialIndex = useMemo(() => {
    const isFind = editOptions.findIndex((e) => e.value === activeEditingOption);
    return isFind === -1 ? 0 : isFind;
  }, [editOptions, activeEditingOption]);

  const keyExtractor = useCallback((item: EditOption) => item.value, []);

  return (
    <WheelSelector
      data={editOptions}
      extraData={activeEditingOption}
      entering={FadeInDown}
      exiting={FadeOutDown}
      renderItem={renderEditItem}
      keyExtractor={keyExtractor}
      onSelectionChange={handleSelectionChange}
      initialIndex={initialIndex}
      enableHaptics={true}
      itemWidth={HEIGHT}
      style={{
        marginVertical: PADDING_VERTICAL,
      }}
    />
  );
};

/* -------------------------------- VARIANTS -------------------------------- */
type ShareRating = {
  rating: number;
  name: string;
  avatarUrl?: string | null;
};

const ShareRatingBadge = ({ rating, name, avatarUrl, scale }: ShareRating & { scale: number }) => {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutDown}
      style={[
        tw`absolute inset-0 justify-center items-center`,
        {
          top: 12 * scale,
          left: 0,
          right: 0,
        },
      ]}
    >
      <View
        style={[
          tw`items-center`,
          {
            gap: 4 * scale,
          },
        ]}
      >
        <View
          style={[
            tw`items-center justify-center aspect-square rounded-full`,
            {
              backgroundColor: colors.accentYellowForeground,
              borderColor: colors.accentYellow,
              borderWidth: 2 * scale,
              padding: 6 * scale,
            },
          ]}
        >
          <Text style={[tw`font-bold`, { color: colors.accentYellow, fontSize: 26 * scale }]}>
            {rating % 1 === 0 ? rating : rating.toFixed(1)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const ShareTvSeriesDefault = ({
  tvSeries,
  posterUrl,
  rating,
  scale = 1,
}: {
  tvSeries: TvSeriesCompact;
  posterUrl: string | undefined;
  rating?: ShareRating | null;
  scale?: number;
}) => {
  const { colors } = useTheme();
  const creatorsText = useMemo(
    () => tvSeries.createdBy?.map((c) => c.name!).join(', '),
    [tvSeries.createdBy],
  );
  return (
    <View
      style={{
        borderRadius: BORDER_RADIUS * scale,
        backgroundColor: Color(colors.muted).alpha(0.95).string(),
        gap: GAP * scale,
        padding: (PADDING / 2) * scale,
      }}
    >
      <View style={tw`relative`}>
        <ImageWithFallback
          source={{ uri: posterUrl ?? '' }}
          alt={tvSeries.name ?? ''}
          type={'tv_series'}
          style={[
            {
              aspectRatio: 2 / 3,
              borderRadius: BORDER_RADIUS * scale,
            },
            tw`w-full h-auto`,
          ]}
        />
        {rating ? <ShareRatingBadge {...rating} scale={scale} /> : null}
      </View>
      <View>
        <Text style={[tw`font-bold`, { fontSize: 16 * scale }]}>{tvSeries.name}</Text>
        {creatorsText && (
          <Text textColor="muted" style={{ fontSize: 12 * scale }}>
            {creatorsText}
          </Text>
        )}
      </View>
      {rating && (
        <View style={[tw`flex-row items-center`, { gap: 4 * scale }]}>
          <UserAvatar
            full_name={rating.name}
            avatar_url={rating.avatarUrl}
            style={{ width: 16 * scale, height: 16 * scale }}
          />
          <Text
            numberOfLines={1}
            style={[tw`font-semibold shrink`, { color: colors.foreground, fontSize: 11 * scale }]}
          >
            {rating.name}
          </Text>
        </View>
      )}
      <Icons.app.logo color={colors.accentYellow} height={10 * scale} />
    </View>
  );
};
/* -------------------------------------------------------------------------- */

/* --------------------------------- CUSTOM --------------------------------- */
const PosterSelector = ({
  tvSeries,
  poster,
  setPoster,
}: {
  tvSeries: TvSeriesCompact;
  poster: TvSeriesImage | undefined;
  setPoster: (poster: TvSeriesImage) => void;
}) => {
  const { data, hasNextPage, fetchNextPage } = useInfiniteQuery(
    tvSeriesImagesInfiniteOptions({
      tvSeriesId: tvSeries.id,
      filters: {
        type: 'poster',
      },
    }),
  );
  const posters = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);
  const initialIndex = useMemo(() => {
    const isFind = posters.findIndex((p) => p.id === poster?.id);
    return isFind === -1 ? 0 : isFind;
  }, [posters]);
  const renderItem = useCallback(
    (item: TvSeriesImage) => (
      <ImageWithFallback
        source={{ uri: getTmdbImage({ path: item.filePath, size: 'w342' }) ?? '' }}
        alt={tvSeries.name ?? ''}
        type={'tv_series'}
        style={[{ aspectRatio: 2 / 3, width: ITEM_WIDTH }]}
      />
    ),
    [tvSeries.name],
  );
  const keyExtractor = useCallback((item: TvSeriesImage) => item.id!.toString(), []);
  const onSelectionChange = useCallback(
    (item: TvSeriesImage) => {
      setPoster(item);
    },
    [setPoster],
  );
  const onEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);
  return (
    <WheelSelector
      entering={FadeInDown}
      exiting={FadeOutDown}
      data={posters}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onSelectionChange={onSelectionChange}
      initialIndex={initialIndex}
      enableHaptics={true}
      itemWidth={ITEM_WIDTH}
      itemSpacing={ITEM_SPACING}
      wheelAngle={0}
      wheelIntensity={0.2}
      onEndReached={onEndReached}
    />
  );
};
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
    (item: string, isActive: boolean) => (
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
  tvSeriesId,
  selectedBackdrop,
  setBackdrop,
  tvSeriesTitle,
}: {
  tvSeriesId: number;
  selectedBackdrop?: TvSeriesImage;
  setBackdrop: (backdrop: TvSeriesImage) => void;
  tvSeriesTitle: string;
}) => {
  const { data, hasNextPage, fetchNextPage } = useInfiniteQuery(
    tvSeriesImagesInfiniteOptions({
      tvSeriesId: tvSeriesId,
      filters: {
        type: 'backdrop',
      },
    }),
  );
  const backdrops = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);

  const renderBackdropItem = useCallback(
    (item: TvSeriesImage, isActive: boolean) => (
      <ImageWithFallback
        source={{ uri: getTmdbImage({ path: item.filePath, size: 'w154' }) ?? '' }}
        alt={tvSeriesTitle}
        type="tv_series"
        style={{ aspectRatio: 2 / 3, width: ITEM_WIDTH }}
      />
    ),
    [tvSeriesTitle],
  );

  const handleBackdropSelection = useCallback(
    (item: TvSeriesImage) => {
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

  const keyExtractor = useCallback((item: TvSeriesImage) => item.id.toString(), []);

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

export const ShareTvSeries = forwardRef<ShareViewRef, ShareTvSeriesProps>(
  ({ tvSeries, variant = 'default', isPremium, ...props }, ref) => {
    const viewShotRef = useRef<ViewShotRef>(null);
    const { height: screenHeight } = useWindowDimensions();
    const { colors } = useTheme();
    const t = useTranslations();
    const { user } = useAuth();
    const { data: log } = useQuery(
      tvSeriesLogOptions({
        userId: user?.id,
        tvSeriesId: tvSeries.id,
      }),
    );
    const hasRating = !!log?.rating;
    const [showRating, setShowRating] = useState(false);
    // States
    const [poster, setPoster] = useState<TvSeriesImage | undefined>(undefined);
    const posterUrl = useMemo(
      () =>
        poster
          ? getTmdbImage({ path: poster.filePath, size: 'w342' })
          : tvSeries.posterPath
            ? getTmdbImage({ path: tvSeries.posterPath, size: 'w342' })
            : undefined,
      [poster, tvSeries.posterPath],
    );
    const [backdrop, setBackdrop] = useState<TvSeriesImage | undefined>(undefined);
    const backdropUrl = useMemo(
      () =>
        backdrop
          ? getTmdbImage({ path: backdrop.filePath, size: 'w780' })
          : tvSeries.backdropPath
            ? getTmdbImage({ path: tvSeries.backdropPath, size: 'w780' })
            : undefined,
      [backdrop, tvSeries.backdropPath],
    );
    const { palette } = useImagePalette(posterUrl);
    const [bgColor, setBgColor] = useState<{ index: number; color: string } | null>(
      palette ? { index: 0, color: palette[0] } : null,
    );
    const [bgType, setBgType] = useState<'color' | 'image'>(
      isPremium && backdropUrl ? 'image' : 'color',
    );
    const [editing, setEditing] = useState(false);
    const editOptions = useMemo((): EditOption[] => {
      const options: EditOption[] = [];
      const hasPoster = !!posterUrl;
      const hasBackground = !!backdropUrl || (bgType === 'color' && bgColor);
      if (hasPoster) {
        options.push({ value: 'poster', icon: ShapeVerticalRoundedForeground });
      }
      if (hasBackground) {
        options.push({ value: 'background', icon: ShapeVerticalRoundedBackground });
      }
      return options;
    }, [posterUrl, backdropUrl, bgType, bgColor]);
    const [activeEditingOption, setActiveEditingOption] = useState(editOptions[0].value);

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

    const ratingBadge: ShareRating | null =
      showRating && log?.rating
        ? {
            rating: log.rating,
            name: user?.name || user?.username || '',
            avatarUrl: user?.avatar,
          }
        : null;

    const renderSticker = useCallback(
      (scale: number) => (
        <ShareTvSeriesDefault
          tvSeries={tvSeries}
          posterUrl={posterUrl}
          rating={ratingBadge}
          scale={scale}
        />
      ),
      [tvSeries, posterUrl, ratingBadge],
    );

    const handleEnableEditing = useCallback(() => {
      if (isPremium) {
        setEditing((v) => !v);
      } else {
        router.push('/upgrade');
      }
    }, [isPremium]);

    const EditSelectors = useMemo(() => {
      if (!editing) return null;
      return (
        <EditOptionsSelector
          editOptions={editOptions}
          activeEditingOption={activeEditingOption}
          setActiveEditingOption={setActiveEditingOption}
        />
      );
    }, [editing, activeEditingOption, editOptions]);

    const EditButtons = useMemo(
      () => (
        <View style={[tw`absolute top-2 right-2 flex-row items-center`, { gap: GAP }]}>
          {editing && (
            <Animated.View
              entering={FadeInRight}
              exiting={FadeOutRight}
              style={[tw`flex-row items-center`, { gap: GAP }]}
            >
              {backdropUrl && activeEditingOption === 'background' && (
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
      [editing, backdrop, activeEditingOption, handleEnableEditing, bgType, bgColor],
    );

    const EditOptions = useMemo(() => {
      if (!editing) return null;
      const content = (() => {
        switch (activeEditingOption) {
          case 'poster':
            return <PosterSelector tvSeries={tvSeries} poster={poster} setPoster={setPoster} />;
          case 'background':
            if (bgType === 'color' && palette) {
              return <ColorSelector colors={palette} bgColor={bgColor} setBgColor={setBgColor} />;
            } else {
              return (
                <BackdropImageSelector
                  tvSeriesId={tvSeries.id}
                  selectedBackdrop={backdrop}
                  setBackdrop={setBackdrop}
                  tvSeriesTitle={tvSeries.name ?? ''}
                />
              );
            }
          default:
            return null;
        }
      })();
      return <View style={[tw`absolute w-full`, { bottom: PADDING_VERTICAL }]}>{content}</View>;
    }, [editing, activeEditingOption, bgType]);

    const RatingToggle = useMemo(() => {
      if (!hasRating) return null;
      return (
        <View
          style={[
            tw`flex-row items-center justify-between`,
            { paddingHorizontal: PADDING_HORIZONTAL, gap: GAP },
          ]}
        >
          <Text>{t('common.messages.share_my_rating')}</Text>
          <Switch value={showRating} onValueChange={setShowRating} />
        </View>
      );
    }, [hasRating, showRating, t]);

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
                height: clamp(400, screenHeight * 0.7),
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
            <ScaledCapture
              ref={viewShotRef}
              targetWidth={SOCIAL_CARD_WIDTH}
              renderContent={renderSticker}
            />
            {EditButtons}
          </View>
          {EditOptions}
        </View>
        {EditSelectors}
        {RatingToggle}
      </View>
    );
  },
);
ShareTvSeries.displayName = 'ShareTvSeries';
