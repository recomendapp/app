import { useCallback } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import {
  Host,
  HStack,
  ZStack,
  ScrollView,
  Mask,
  Rectangle,
  Button,
  Image,
  Text,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  frame,
  padding,
  foregroundStyle,
  background,
  strokeBorder,
  bold,
  shapes,
  font,
  offset,
  onLongPressGesture,
} from '@expo/ui/swift-ui/modifiers';
import { MovieCompact } from '@libs/api-js';
import {
  movieLogOptions,
  userBookmarkByMediaOptions,
  useUserBookmarkDeleteByMediaMutation,
  useUserBookmarkSetByMediaMutation,
} from '@libs/query-client';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { useToast } from '../../Toast';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import { BottomSheetBookmarkComment } from '../../bottom-sheets/sheets/BottomSheetBookmarkComment';

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
  NativeTabs.BottomAccessory.usePlacement();
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
  const { mutateAsync: setBookmark } = useUserBookmarkSetByMediaMutation();
  const { mutateAsync: deleteBookmark } = useUserBookmarkDeleteByMediaMutation();

  const onError = useCallback(
    () => toast.error(upperFirst(t('common.messages.an_error_occurred'))),
    [toast, t],
  );

  const handleOpenLogPress = useCallback(() => {
    router.push({ pathname: '/film/[film_id]/log', params: { film_id: movie.id } });
  }, [movie, router]);

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

  const handleBookmarkLongPress = useCallback(() => {
    if (bookmark?.id) {
      openSheet(BottomSheetBookmarkComment, { data: bookmark });
    }
  }, [bookmark, openSheet]);

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
                <ZStack
                  alignment="center"
                  // Same minWidth/minHeight the Button below declares for itself, so the heart
                  // badge's offset math has a known baseline box — using minWidth (not a fixed
                  // width) lets the ZStack still grow with the button's actual content (e.g. a
                  // two-digit rating needs more than 40pt); pinning it to an exact width clipped
                  // the button and made it bleed into the next HStack item, killing the gap
                  // between this button and the bookmark one.
                  modifiers={[
                    frame(
                      log?.rating
                        ? { minWidth: 40, minHeight: 32 }
                        : { minWidth: 28, minHeight: 28 },
                    ),
                  ]}
                >
                  <Button
                    onPress={handleOpenLogPress}
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
                      <Image
                        systemName={log ? 'checkmark.circle.fill' : 'checkmark.circle'}
                        color={log ? colors.accentBlue : undefined}
                      />
                    )}
                  </Button>
                  {/* Sibling of Button (not nested inside it) so it draws above the button's
                      own border/background overlay — nesting it as a child put it BEHIND the
                      strokeBorder on the rating chip. */}
                  {log?.isLiked && (
                    <Image
                      systemName="heart.fill"
                      color={colors.accentPink}
                      modifiers={[
                        font({ size: 13 }),
                        // offset (not frame+alignment) so the badge doesn't expand the
                        // ZStack — just nudges it so its own center lands on the ZStack's
                        // (now fixed, see above) bottom-right corner — roughly half of its
                        // own width/height.
                        offset(log?.rating ? { x: 20, y: 16 } : { x: 14, y: 14 }),
                      ]}
                    />
                  )}
                </ZStack>
                <Button
                  onPress={handleBookmarkToggle}
                  modifiers={[buttonStyle('glass'), onLongPressGesture(handleBookmarkLongPress)]}
                >
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
