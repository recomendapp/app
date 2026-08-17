import { useCallback } from 'react';
import { Alert } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { upperFirst } from 'lodash';
import { useTranslations } from 'use-intl';
import {
  tvEpisodeLogOptions,
  tvSeasonOptions,
  useTvEpisodeLogDeleteMutation,
  useTvEpisodeLogSetMutation,
} from '@libs/query-client';
import { View } from '../../../../../../../components/ui/view';
import { Text } from '../../../../../../../components/ui/text';
import { Button } from '../../../../../../../components/ui/Button';
import { Icons } from '../../../../../../../constants/Icons';
import { RatingPicker } from '../../../../../../../components/medias/RatingPicker';
import { LogActionButton } from '../../../../../../../components/medias/LogActionButton';
import { useModalHeaderOptions } from '../../../../../../../hooks/useModalHeaderOptions';
import { useAuth } from '../../../../../../../providers/AuthProvider';
import { useTheme } from '../../../../../../../providers/ThemeProvider';
import { useToast } from '../../../../../../../components/Toast';
import { getIdFromSlug } from '../../../../../../../utils/getIdFromSlug';
import tw from '../../../../../../../lib/tw';
import {
  GAP,
  GAP_LG,
  PADDING_HORIZONTAL,
  PADDING_VERTICAL,
} from '../../../../../../../theme/globals';
import { Divider } from '../../../../../../../components/ui/Divider';

// Same shape as season/[season_number]/log.tsx, minus status states and the like/review actions
// — an episode log is a plain watched/not-watched record with an optional rating (see
// LogTvEpisodeRequest on web's ButtonLogTvEpisodeWatch.tsx), no "watching"/"completed"
// distinction like series/seasons have.
const TvEpisodeLogScreen = () => {
  const { tv_series_id, season_number, episode_number } = useLocalSearchParams<{
    tv_series_id: string;
    season_number: string;
    episode_number: string;
  }>();
  const { id: tvSeriesId } = getIdFromSlug(tv_series_id);
  const seasonNumber = Number(season_number);
  const episodeNumber = Number(episode_number);
  const { user } = useAuth();
  const { colors, mode } = useTheme();
  const router = useRouter();
  const t = useTranslations();
  const toast = useToast();

  const { data: season } = useQuery(tvSeasonOptions({ tvSeriesId, seasonNumber }));
  const { data: log } = useQuery(
    tvEpisodeLogOptions({ userId: user?.id, tvSeriesId, seasonNumber, episodeNumber }),
  );
  const { mutateAsync: setLog } = useTvEpisodeLogSetMutation();
  const { mutateAsync: deleteLog } = useTvEpisodeLogDeleteMutation();

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
              deleteLog(
                {
                  path: {
                    tv_series_id: tvSeriesId,
                    season_number: seasonNumber,
                    episode_number: episodeNumber,
                  },
                },
                { onError },
              );
            },
            style: 'destructive',
          },
        ],
        { userInterfaceStyle: mode },
      );
    } else {
      setLog(
        {
          path: {
            tv_series_id: tvSeriesId,
            season_number: seasonNumber,
            episode_number: episodeNumber,
          },
          body: {},
        },
        { onError },
      );
    }
  }, [log, tvSeriesId, seasonNumber, episodeNumber, setLog, deleteLog, onError, t, mode]);

  const handleRatingChange = useCallback(
    (rating: number) => {
      setLog(
        {
          path: {
            tv_series_id: tvSeriesId,
            season_number: seasonNumber,
            episode_number: episodeNumber,
          },
          body: { rating },
        },
        { onError },
      );
    },
    [tvSeriesId, seasonNumber, episodeNumber, setLog, onError],
  );

  const handleRemoveRating = useCallback(() => {
    setLog(
      {
        path: {
          tv_series_id: tvSeriesId,
          season_number: seasonNumber,
          episode_number: episodeNumber,
        },
        body: { rating: null },
      },
      { onError },
    );
  }, [tvSeriesId, seasonNumber, episodeNumber, setLog, onError]);

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
                    t('common.messages.tv_episode_short', {
                      seasonNumber: season.seasonNumber,
                      episodeNumber,
                    }),
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
              icon={Icons.Check}
              label={upperFirst(
                t(log ? 'common.messages.remove_from_watched' : 'common.messages.mark_as_watched'),
              )}
              onPress={handleWatchToggle}
              iconBackgroundColor={log ? colors.accentBlue : colors.muted}
              iconColor={log ? colors.accentBlueForeground : colors.mutedForeground}
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

export default TvEpisodeLogScreen;
