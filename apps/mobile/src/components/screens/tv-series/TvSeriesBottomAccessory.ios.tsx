import { useCallback } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { Host, HStack, ScrollView, Mask, Rectangle, Button, Image, Text } from '@expo/ui/swift-ui';
import {
  buttonStyle,
  frame,
  padding,
  foregroundStyle,
  background,
  strokeBorder,
  bold,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { TvSeriesCompact } from '@libs/api-js';
import {
  tvSeriesLogOptions,
  userBookmarkByMediaOptions,
  useTvSeriesLogDeleteMutation,
  useTvSeriesLogSetMutation,
  useUserBookmarkDeleteByMediaMutation,
  useUserBookmarkSetByMediaMutation,
} from '@libs/query-client';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { useToast } from '../../Toast';
import { getTmdbImage } from '../../../lib/tmdb/getTmdbImage';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import BottomSheetRating from '../../bottom-sheets/sheets/BottomSheetRating';

interface TvSeriesBottomAccessoryProps {
  tvSeries: TvSeriesCompact;
}

const SCROLL_FADE_WIDTH = 24;

/**
 * Native SwiftUI variant, only rendered when Liquid Glass is available (see (tabs)/_layout.tsx
 * + useBottomAccessoryStore). Only ever mounted inside <NativeTabs.BottomAccessory> —
 * usePlacement() requires that context. Mirrors FilmBottomAccessory.ios.tsx, minus the watch
 * date button (no equivalent feature for TV series).
 */
export const TvSeriesBottomAccessory = ({ tvSeries }: TvSeriesBottomAccessoryProps) => {
  NativeTabs.BottomAccessory.usePlacement();
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const t = useTranslations();
  const router = useRouter();
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const { data: log } = useQuery(tvSeriesLogOptions({ userId: user?.id, tvSeriesId: tvSeries.id }));
  const { data: bookmark } = useQuery(
    userBookmarkByMediaOptions({ mediaId: tvSeries.id, type: 'tv_series', userId: user?.id }),
  );
  const { mutateAsync: setLog } = useTvSeriesLogSetMutation();
  const { mutateAsync: deleteLog } = useTvSeriesLogDeleteMutation();
  const { mutateAsync: setBookmark } = useUserBookmarkSetByMediaMutation();
  const { mutateAsync: deleteBookmark } = useUserBookmarkDeleteByMediaMutation();

  const onError = useCallback(
    () => toast.error(upperFirst(t('common.messages.an_error_occurred'))),
    [toast, t],
  );

  const handleRatingPress = useCallback(() => {
    openSheet(BottomSheetRating, {
      media: {
        title: tvSeries.name || '',
        imageUrl: getTmdbImage({ path: tvSeries.posterPath, size: 'w342' }) || '',
        type: 'tv_series',
      },
      rating: log?.rating || null,
      onRatingChange: async (rating) => {
        await setLog({ path: { tv_series_id: tvSeries.id }, body: { rating } }, { onError });
      },
    });
  }, [tvSeries, log?.rating, openSheet, setLog, onError]);

  const handleLikeToggle = useCallback(async () => {
    await setLog(
      { path: { tv_series_id: tvSeries.id }, body: { isLiked: !log?.isLiked } },
      { onError },
    );
  }, [tvSeries, log?.isLiked, setLog, onError]);

  const handleWatchToggle = useCallback(async () => {
    if (log) {
      await deleteLog({ path: { tv_series_id: tvSeries.id } }, { onError });
    } else {
      await setLog({ path: { tv_series_id: tvSeries.id }, body: {} }, { onError });
    }
  }, [tvSeries, log, setLog, deleteLog, onError]);

  const handleBookmarkToggle = useCallback(async () => {
    if (bookmark) {
      await deleteBookmark(
        { path: { media_id: bookmark.mediaId, type: bookmark.type } },
        { onError },
      );
    } else {
      await setBookmark(
        { path: { media_id: tvSeries.id, type: 'tv_series' }, body: {} },
        { onError },
      );
    }
  }, [tvSeries, bookmark, setBookmark, deleteBookmark, onError]);

  const handlePlaylistAddPress = useCallback(() => {
    router.push({
      pathname: '/playlist/add/[type]/[id]',
      params: { type: 'tv_series', id: tvSeries.id, title: tvSeries.name },
    });
  }, [tvSeries, router]);

  const handleRecoSendPress = useCallback(() => {
    router.push({
      pathname: '/reco/send/[type]/[id]',
      params: { type: 'tv_series', id: tvSeries.id, title: tvSeries.name },
    });
  }, [tvSeries, router]);

  return (
    <View style={{ flex: 1, width: '100%', justifyContent: 'center' }}>
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <HStack
          spacing={8}
          alignment="center"
          modifiers={[
            frame({ maxWidth: Infinity, alignment: 'center' }),
            padding({ trailing: 16 }),
          ]}
        >
          <Mask alignment="center">
            <ScrollView axes="horizontal" showsIndicators={false}>
              <HStack
                spacing={8}
                alignment="center"
                modifiers={[padding({ leading: 16, trailing: 16, vertical: 6 })]}
              >
                <Button
                  onPress={handleRatingPress}
                  modifiers={
                    log?.rating
                      ? [
                          buttonStyle('plain'),
                          padding({ horizontal: 10, vertical: 6 }),
                          background(
                            colors.accentYellowForeground,
                            shapes.roundedRectangle({ cornerRadius: 8 }),
                          ),
                          strokeBorder({
                            color: colors.accentYellow,
                            shape: 'roundedRectangle',
                            cornerRadius: 8,
                          }),
                          frame({ minWidth: 40, minHeight: 32, alignment: 'center' }),
                        ]
                      : [buttonStyle('glass')]
                  }
                >
                  {log?.rating ? (
                    <Text modifiers={[bold(), foregroundStyle(colors.accentYellow)]}>
                      {String(log.rating)}
                    </Text>
                  ) : (
                    <Image systemName="star" />
                  )}
                </Button>
                <Button onPress={handleLikeToggle} modifiers={[buttonStyle('glass')]}>
                  <Image
                    systemName={log?.isLiked ? 'heart.fill' : 'heart'}
                    color={log?.isLiked ? colors.accentPink : undefined}
                  />
                </Button>
                <Button onPress={handleWatchToggle} modifiers={[buttonStyle('glass')]}>
                  <Image
                    systemName={log ? 'checkmark.circle.fill' : 'checkmark.circle'}
                    color={log ? colors.accentBlue : undefined}
                  />
                </Button>
                <Button onPress={handleBookmarkToggle} modifiers={[buttonStyle('glass')]}>
                  <Image systemName={bookmark ? 'bookmark.fill' : 'bookmark'} />
                </Button>
              </HStack>
            </ScrollView>
            <Mask.Content>
              <HStack spacing={0} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
                <Rectangle modifiers={[foregroundStyle('black'), frame({ maxWidth: Infinity })]} />
                <Rectangle
                  modifiers={[
                    foregroundStyle({
                      type: 'linearGradient',
                      colors: ['black', 'transparent'],
                      startPoint: { x: 0, y: 0.5 },
                      endPoint: { x: 1, y: 0.5 },
                    }),
                    frame({ width: SCROLL_FADE_WIDTH }),
                  ]}
                />
              </HStack>
            </Mask.Content>
          </Mask>
          <Button onPress={handlePlaylistAddPress} modifiers={[buttonStyle('glass')]}>
            <Image systemName="plus.rectangle.on.rectangle" />
          </Button>
          <Button onPress={handleRecoSendPress} modifiers={[buttonStyle('glass')]}>
            <Image systemName="paperplane" />
          </Button>
        </HStack>
      </Host>
    </View>
  );
};
