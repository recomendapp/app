import { useCallback } from 'react';
import { Alert } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { upperFirst } from 'lodash';
import { useFormatter, useTranslations } from 'use-intl';
import {
  movieLogOptions,
  movieOptions,
  useMovieLogDeleteMutation,
  useMovieLogSetMutation,
} from '@libs/query-client';
import { View } from '../../../components/ui/view';
import { Text } from '../../../components/ui/text';
import { Button } from '../../../components/ui/Button';
import { Icons } from '../../../constants/Icons';
import { RatingPicker } from '../../../components/medias/RatingPicker';
import { LogActionButton } from '../../../components/medias/LogActionButton';
import { useModalHeaderOptions } from '../../../hooks/useModalHeaderOptions';
import { useAuth } from '../../../providers/AuthProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { useToast } from '../../../components/Toast';
import { getIdFromSlug } from '../../../utils/getIdFromSlug';
import tw from '../../../lib/tw';
import { GAP, GAP_LG, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../theme/globals';
import { Divider } from '../../../components/ui/Divider';

const FilmLogScreen = () => {
  const { film_id } = useLocalSearchParams<{ film_id: string }>();
  const { id: movieId } = getIdFromSlug(film_id);
  const { user } = useAuth();
  const { colors, mode } = useTheme();
  const router = useRouter();
  const t = useTranslations();
  const formatter = useFormatter();
  const toast = useToast();

  const { data: movie } = useQuery(movieOptions({ movieId }));
  const { data: log } = useQuery(movieLogOptions({ userId: user?.id, movieId }));
  const { mutateAsync: setLog } = useMovieLogSetMutation();
  const { mutateAsync: deleteLog } = useMovieLogDeleteMutation();

  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });

  const onError = useCallback(
    () => toast.error(upperFirst(t('common.messages.an_error_occurred'))),
    [toast, t],
  );

  const handleWatchToggle = useCallback(() => {
    if (log) {
      Alert.alert(
        upperFirst(t('common.messages.are_u_sure')),
        upperFirst(t('components.media.actions.watch.remove_from_watched.description')),
        [
          { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
          {
            text: upperFirst(t('common.messages.confirm')),
            onPress: () => {
              deleteLog({ path: { movie_id: movieId } }, { onError });
            },
            style: 'destructive',
          },
        ],
        { userInterfaceStyle: mode },
      );
    } else {
      setLog({ path: { movie_id: movieId }, body: {} }, { onError });
    }
  }, [log, movieId, setLog, deleteLog, onError, t, mode]);

  const handleLikeToggle = useCallback(() => {
    setLog({ path: { movie_id: movieId }, body: { isLiked: !log?.isLiked } }, { onError });
  }, [movieId, log?.isLiked, setLog, onError]);

  const handleRatingChange = useCallback(
    (rating: number) => {
      setLog({ path: { movie_id: movieId }, body: { rating } }, { onError });
    },
    [movieId, setLog, onError],
  );

  const handleRemoveRating = useCallback(() => {
    setLog({ path: { movie_id: movieId }, body: { rating: null } }, { onError });
  }, [movieId, setLog, onError]);

  const handleWatchDatePress = useCallback(() => {
    router.push({ pathname: '/film/[film_id]/watched-dates', params: { film_id: movieId } });
  }, [movieId, router]);

  const handleViewOrCreateReview = useCallback(() => {
    if (router.canDismiss()) {
      router.dismiss();
    } else if (router.canGoBack()) {
      router.back();
    }
    if (log?.review && user) {
      router.push({
        pathname: '/user/[username]/film/[film_id]',
        params: { username: user.username, film_id: movieId },
      });
    } else {
      router.push({ pathname: '/film/[film_id]/review', params: { film_id: movieId } });
    }
  }, [log?.review, user, router, movieId]);

  const ratingOpacityStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(log?.rating ? 1 : 0.5, { duration: 200 }),
    }),
    [log?.rating],
  );

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerTransparent: false,
          headerTitle: () => (
            <View style={tw`items-center`}>
              <Text numberOfLines={1} style={tw`font-semibold`}>
                {movie?.title}
              </Text>
              {movie?.releaseDate && (
                <Text numberOfLines={1} style={[tw`text-xs`, { color: colors.mutedForeground }]}>
                  {formatter.dateTime(new Date(movie.releaseDate), { year: 'numeric' })}
                </Text>
              )}
            </View>
          ),
        }}
      />
      <View style={[tw`flex-1 justify-between`, { gap: GAP_LG }]}>
        <View style={{ gap: GAP_LG, paddingTop: PADDING_VERTICAL }}>
          <View
            style={[
              tw`flex-row items-center justify-center gap-2`,
              { paddingHorizontal: PADDING_HORIZONTAL },
            ]}
          >
            <LogActionButton
              icon={Icons.Check}
              label={upperFirst(
                t(log ? 'common.messages.remove_from_watched' : 'common.messages.mark_as_watched'),
              )}
              onPress={handleWatchToggle}
              iconBackgroundColor={log ? colors.accentBlue : colors.muted}
              iconColor={log ? colors.accentBlueForeground : colors.mutedForeground}
            />
            <LogActionButton
              icon={Icons.like}
              label={upperFirst(
                t(log?.isLiked ? 'common.messages.unlike' : 'common.messages.like'),
              )}
              onPress={handleLikeToggle}
              iconColor={log?.isLiked ? colors.accentPink : colors.mutedForeground}
              iconFill={log?.isLiked ? colors.accentPink : 'transparent'}
            />
          </View>
          <Divider />
          <Animated.View style={[{ gap: GAP }, ratingOpacityStyle]}>
            <View style={{ paddingHorizontal: PADDING_HORIZONTAL }}>
              <Text variant="title" style={tw`font-medium text-center`}>
                {upperFirst(t('common.messages.rating'))}
              </Text>
            </View>
            <RatingPicker
              rating={log?.rating}
              onRatingChange={handleRatingChange}
              onClear={handleRemoveRating}
            />
          </Animated.View>
          {log && (
            <>
              <Divider />
              <View
                style={[
                  tw`flex-col items-center justify-center gap-2`,
                  { paddingHorizontal: PADDING_HORIZONTAL },
                ]}
              >
                <Button variant="outline" icon={Icons.Calendar} onPress={handleWatchDatePress}>
                  {upperFirst(t('common.messages.watched_dates'))}
                </Button>
                <Button
                  variant="outline"
                  icon={log.review ? Icons.Eye : Icons.Edit}
                  onPress={handleViewOrCreateReview}
                >
                  {log.review
                    ? upperFirst(t('common.messages.my_review', { count: 1 }))
                    : upperFirst(t('common.messages.add_review'))}
                </Button>
              </View>
            </>
          )}
        </View>
        <View
          style={{
            paddingHorizontal: PADDING_HORIZONTAL,
            paddingBottom: PADDING_VERTICAL,
          }}
        >
          <Button variant="outline" onPress={() => router.dismiss()}>
            {upperFirst(t('common.messages.close'))}
          </Button>
        </View>
      </View>
    </>
  );
};

export default FilmLogScreen;
