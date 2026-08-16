import { useCallback } from 'react';
import { Alert } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import {
  tvSeasonLogOptions,
  tvSeasonOptions,
  useTvSeasonLogDeleteMutation,
  useTvSeasonLogSetMutation,
} from '@libs/query-client';
import { View } from '../../../../../components/ui/view';
import { Text } from '../../../../../components/ui/text';
import { Button } from '../../../../../components/ui/Button';
import { Icons } from '../../../../../constants/Icons';
import { RatingPicker } from '../../../../../components/medias/RatingPicker';
import { LogActionButton } from '../../../../../components/medias/LogActionButton';
import { useModalHeaderOptions } from '../../../../../hooks/useModalHeaderOptions';
import { useAuth } from '../../../../../providers/AuthProvider';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { useToast } from '../../../../../components/Toast';
import { getIdFromSlug } from '../../../../../utils/getIdFromSlug';
import tw from '../../../../../lib/tw';
import { GAP, GAP_LG, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { Divider } from '../../../../../components/ui/Divider';

// Same shape as tv-series/[tv_series_id]/log.tsx, minus like and review — seasons have neither
// (see ButtonLogTvSeasonWatch.tsx / ButtonLogTvSeasonRating.tsx on web).
const TvSeasonLogScreen = () => {
  const { tv_series_id, season_number } = useLocalSearchParams<{
    tv_series_id: string;
    season_number: string;
  }>();
  const { id: tvSeriesId } = getIdFromSlug(tv_series_id);
  const seasonNumber = Number(season_number);
  const { user } = useAuth();
  const { colors, mode } = useTheme();
  const router = useRouter();
  const t = useTranslations();
  const toast = useToast();

  const { data: season } = useQuery(tvSeasonOptions({ tvSeriesId, seasonNumber }));
  const { data: log } = useQuery(
    tvSeasonLogOptions({ userId: user?.id, tvSeriesId, seasonNumber }),
  );
  const { mutateAsync: setLog } = useTvSeasonLogSetMutation();
  const { mutateAsync: deleteLog } = useTvSeasonLogDeleteMutation();

  const modalHeaderOptions = useModalHeaderOptions({ forceCross: true });

  const onError = useCallback(
    () => toast.error(upperFirst(t('common.messages.an_error_occurred'))),
    [toast, t],
  );

  // Seasons have no plain "watched" state either — a log always carries a status, and
  // completing one is one-way: there's no going back to "in progress".
  const handleMarkAsCompleted = useCallback(() => {
    Alert.alert(
      upperFirst(t('common.messages.are_u_sure')),
      t('components.tv_series.season.actions.watch.complete.description', { seasonNumber }),
      [
        { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
        {
          text: upperFirst(t('common.messages.confirm')),
          onPress: () => {
            setLog(
              {
                path: { tv_series_id: tvSeriesId, season_number: seasonNumber },
                body: { status: 'completed' },
              },
              { onError },
            );
          },
        },
      ],
      { userInterfaceStyle: mode },
    );
  }, [tvSeriesId, seasonNumber, setLog, onError, t, mode]);

  const handleDeleteLog = useCallback(() => {
    Alert.alert(
      upperFirst(t('common.messages.are_u_sure')),
      upperFirst(t('components.media.actions.watch.remove_from_watched.description')),
      [
        { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
        {
          text: upperFirst(t('common.messages.confirm')),
          onPress: () => {
            deleteLog(
              { path: { tv_series_id: tvSeriesId, season_number: seasonNumber } },
              { onError },
            );
          },
          style: 'destructive',
        },
      ],
      { userInterfaceStyle: mode },
    );
  }, [tvSeriesId, seasonNumber, deleteLog, onError, t, mode]);

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
                {
                  path: { tv_series_id: tvSeriesId, season_number: seasonNumber },
                  body: { status: 'watching' },
                },
                { onError },
              );
            },
          },
          { text: upperFirst(t('common.messages.complete')), onPress: handleMarkAsCompleted },
        ],
        { userInterfaceStyle: mode },
      );
    } else if (log.status === 'completed') {
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
  }, [
    log,
    tvSeriesId,
    seasonNumber,
    setLog,
    onError,
    t,
    mode,
    handleMarkAsCompleted,
    handleDeleteLog,
  ]);

  const handleRatingChange = useCallback(
    (rating: number) => {
      setLog(
        { path: { tv_series_id: tvSeriesId, season_number: seasonNumber }, body: { rating } },
        { onError },
      );
    },
    [tvSeriesId, seasonNumber, setLog, onError],
  );

  const handleRemoveRating = useCallback(() => {
    setLog(
      { path: { tv_series_id: tvSeriesId, season_number: seasonNumber }, body: { rating: null } },
      { onError },
    );
  }, [tvSeriesId, seasonNumber, setLog, onError]);

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
                {season?.tvSeries?.name}
              </Text>
              {season && (
                <Text numberOfLines={1} style={[tw`text-xs`, { color: colors.mutedForeground }]}>
                  {upperFirst(
                    t('common.messages.tv_season_value', { number: season.seasonNumber }),
                  )}
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

export default TvSeasonLogScreen;
