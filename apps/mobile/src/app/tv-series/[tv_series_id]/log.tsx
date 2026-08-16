import { useCallback } from 'react';
import { Alert } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { upperFirst } from 'lodash';
import { useFormatter, useTranslations } from 'use-intl';
import {
  tvSeriesLogOptions,
  tvSeriesOptions,
  useTvSeriesLogDeleteMutation,
  useTvSeriesLogSetMutation,
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

// Same shape as film/[film_id]/log.tsx, minus watched dates — that concept doesn't exist for
// TV series in this app (see FilmBottomAccessory.ios.tsx vs TvSeriesBottomAccessory.ios.tsx).
const TvSeriesLogScreen = () => {
  const { tv_series_id } = useLocalSearchParams<{ tv_series_id: string }>();
  const { id: tvSeriesId } = getIdFromSlug(tv_series_id);
  const { user } = useAuth();
  const { colors, mode } = useTheme();
  const router = useRouter();
  const t = useTranslations();
  const formatter = useFormatter();
  const toast = useToast();

  const { data: tvSeries } = useQuery(tvSeriesOptions({ tvSeriesId }));
  const { data: log } = useQuery(tvSeriesLogOptions({ userId: user?.id, tvSeriesId }));
  const { mutateAsync: setLog } = useTvSeriesLogSetMutation();
  const { mutateAsync: deleteLog } = useTvSeriesLogDeleteMutation();

  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });

  const onError = useCallback(
    () => toast.error(upperFirst(t('common.messages.an_error_occurred'))),
    [toast, t],
  );

  // TV series have no plain "watched" state — a log always carries a status, and (per the web
  // ButtonLogTvSeriesWatch) completing one is one-way: there's no going back to "in progress".
  const handleMarkAsCompleted = useCallback(() => {
    Alert.alert(
      upperFirst(t('common.messages.are_u_sure')),
      t('components.tv_series.actions.watch.complete.description'),
      [
        { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
        {
          text: upperFirst(t('common.messages.confirm')),
          onPress: () => {
            setLog(
              { path: { tv_series_id: tvSeriesId }, body: { status: 'completed' } },
              { onError },
            );
          },
        },
      ],
      { userInterfaceStyle: mode },
    );
  }, [tvSeriesId, setLog, onError, t, mode]);

  const handleDeleteLog = useCallback(() => {
    Alert.alert(
      upperFirst(t('common.messages.are_u_sure')),
      upperFirst(t('components.media.actions.watch.remove_from_watched.description')),
      [
        { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
        {
          text: upperFirst(t('common.messages.confirm')),
          onPress: () => {
            deleteLog({ path: { tv_series_id: tvSeriesId } }, { onError });
          },
          style: 'destructive',
        },
      ],
      { userInterfaceStyle: mode },
    );
  }, [tvSeriesId, deleteLog, onError, t, mode]);

  const handleWatchToggle = useCallback(() => {
    if (!log) {
      Alert.alert(
        upperFirst(t('common.messages.mark_as_watched')),
        undefined,
        [
          { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
          {
            text: upperFirst(t('common.messages.in_progress')),
            onPress: () => {
              setLog(
                { path: { tv_series_id: tvSeriesId }, body: { status: 'watching' } },
                { onError },
              );
            },
          },
          { text: upperFirst(t('common.messages.complete')), onPress: handleMarkAsCompleted },
        ],
        { userInterfaceStyle: mode },
      );
    } else if (log.status === 'completed') {
      // Nothing left to offer besides removing the log entirely — completed is one-way.
      handleDeleteLog();
    } else {
      Alert.alert(
        upperFirst(t('common.messages.mark_as_watched')),
        undefined,
        [
          { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
          { text: upperFirst(t('common.messages.complete')), onPress: handleMarkAsCompleted },
          {
            text: upperFirst(t('common.messages.delete')),
            onPress: handleDeleteLog,
            style: 'destructive',
          },
        ],
        { userInterfaceStyle: mode },
      );
    }
  }, [log, tvSeriesId, setLog, onError, t, mode, handleMarkAsCompleted, handleDeleteLog]);

  const handleLikeToggle = useCallback(() => {
    setLog({ path: { tv_series_id: tvSeriesId }, body: { isLiked: !log?.isLiked } }, { onError });
  }, [tvSeriesId, log?.isLiked, setLog, onError]);

  const handleRatingChange = useCallback(
    (rating: number) => {
      setLog({ path: { tv_series_id: tvSeriesId }, body: { rating } }, { onError });
    },
    [tvSeriesId, setLog, onError],
  );

  const handleRemoveRating = useCallback(() => {
    setLog({ path: { tv_series_id: tvSeriesId }, body: { rating: null } }, { onError });
  }, [tvSeriesId, setLog, onError]);

  // Mirrors tv-series/[tv_series_id]/reviews.tsx's handleViewOrCreateReview.
  const handleViewOrCreateReview = useCallback(() => {
    if (log?.review && user) {
      router.replace({
        pathname: '/user/[username]/tv-series/[tv_series_id]',
        params: { username: user.username, tv_series_id: tvSeriesId },
      });
    } else {
      router.push({
        pathname: '/tv-series/[tv_series_id]/review',
        params: { tv_series_id: tvSeriesId },
      });
    }
  }, [log?.review, user, router, tvSeriesId]);

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
                {tvSeries?.name}
              </Text>
              {tvSeries?.firstAirDate && (
                <Text numberOfLines={1} style={[tw`text-xs`, { color: colors.mutedForeground }]}>
                  {formatter.dateTime(new Date(tvSeries.firstAirDate), { year: 'numeric' })}
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
              icon={log?.status === 'watching' ? Icons.Clock : Icons.Check}
              label={upperFirst(
                t(
                  !log
                    ? 'common.messages.mark_as_watched'
                    : log.status === 'watching'
                      ? 'common.messages.in_progress'
                      : 'common.messages.completed',
                ),
              )}
              onPress={handleWatchToggle}
              iconBackgroundColor={
                !log
                  ? colors.muted
                  : log.status === 'watching'
                    ? colors.accentOrange
                    : colors.accentBlue
              }
              iconColor={
                !log
                  ? colors.mutedForeground
                  : log.status === 'watching'
                    ? colors.accentOrangeForeground
                    : colors.accentBlueForeground
              }
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

export default TvSeriesLogScreen;
