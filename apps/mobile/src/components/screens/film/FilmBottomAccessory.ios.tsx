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
import { MovieCompact } from '@libs/api-js';
import {
  movieLogOptions,
  userBookmarkByMediaOptions,
  useMovieLogDeleteMutation,
  useMovieLogSetMutation,
  useUserBookmarkDeleteByMediaMutation,
  useUserBookmarkSetByMediaMutation,
} from '@libs/query-client';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { useToast } from '../../Toast';
import { getTmdbImage } from '../../../lib/tmdb/getTmdbImage';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import BottomSheetRating from '../../bottom-sheets/sheets/BottomSheetRating';

interface FilmBottomAccessoryProps {
  movie: MovieCompact;
}

const SCROLL_FADE_WIDTH = 24;

/**
 * Native SwiftUI variant, only rendered when Liquid Glass is available (see (tabs)/_layout.tsx
 * + useBottomAccessoryStore). Only ever mounted inside <NativeTabs.BottomAccessory> —
 * usePlacement() requires that context.
 */
export const FilmBottomAccessory = ({ movie }: FilmBottomAccessoryProps) => {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const isInline = placement === 'inline';
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const t = useTranslations();
  const router = useRouter();
  const openSheet = useBottomSheetStore((state) => state.openSheet);

  const { data: log } = useQuery(movieLogOptions({ userId: user?.id, movieId: movie.id }));
  const { data: bookmark } = useQuery(
    userBookmarkByMediaOptions({ mediaId: movie.id, type: 'movie', userId: user?.id }),
  );
  const { mutateAsync: setLog } = useMovieLogSetMutation();
  const { mutateAsync: deleteLog } = useMovieLogDeleteMutation();
  const { mutateAsync: setBookmark } = useUserBookmarkSetByMediaMutation();
  const { mutateAsync: deleteBookmark } = useUserBookmarkDeleteByMediaMutation();

  const onError = useCallback(
    () => toast.error(upperFirst(t('common.messages.an_error_occurred'))),
    [toast, t],
  );

  const handleRatingPress = useCallback(() => {
    openSheet(BottomSheetRating, {
      media: {
        title: movie.title || '',
        imageUrl: getTmdbImage({ path: movie.posterPath, size: 'w342' }) || '',
        type: 'movie',
      },
      rating: log?.rating || null,
      onRatingChange: async (rating) => {
        await setLog({ path: { movie_id: movie.id }, body: { rating } }, { onError });
      },
    });
  }, [movie, log?.rating, openSheet, setLog, onError]);

  const handleLikeToggle = useCallback(async () => {
    await setLog({ path: { movie_id: movie.id }, body: { isLiked: !log?.isLiked } }, { onError });
  }, [movie, log?.isLiked, setLog, onError]);

  const handleWatchToggle = useCallback(async () => {
    if (log) {
      await deleteLog({ path: { movie_id: movie.id } }, { onError });
    } else {
      await setLog({ path: { movie_id: movie.id }, body: {} }, { onError });
    }
  }, [movie, log, setLog, deleteLog, onError]);

  const handleBookmarkToggle = useCallback(async () => {
    if (bookmark) {
      await deleteBookmark(
        { path: { media_id: bookmark.mediaId, type: bookmark.type } },
        { onError },
      );
    } else {
      await setBookmark({ path: { media_id: movie.id, type: 'movie' }, body: {} }, { onError });
    }
  }, [movie, bookmark, setBookmark, deleteBookmark, onError]);

  const handleWatchDatePress = useCallback(() => {
    router.push({ pathname: '/film/[film_id]/watched-dates', params: { film_id: movie.id } });
  }, [movie, router]);

  const handlePlaylistAddPress = useCallback(() => {
    router.push({
      pathname: '/playlist/add/[type]/[id]',
      params: { type: 'movie', id: movie.id, title: movie.title },
    });
  }, [movie, router]);

  const handleRecoSendPress = useCallback(() => {
    router.push({
      pathname: '/reco/send/[type]/[id]',
      params: { type: 'movie', id: movie.id, title: movie.title },
    });
  }, [movie, router]);

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
                {!isInline && log && (
                  <Button onPress={handleWatchDatePress} modifiers={[buttonStyle('glass')]}>
                    <Image systemName="calendar" />
                  </Button>
                )}
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
