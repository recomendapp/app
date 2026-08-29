import { Stack, useLocalSearchParams } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'use-intl';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  movieLogOptions,
  importLogMoviesInfiniteOptions,
  useImportPatchLogMovieMutation,
  useImportPatchLogMovieReviewMutation,
} from '@libs/query-client';
import { ImportJobLogMovie } from '@libs/api-js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../../../components/ui/text';
import { View } from '../../../../../components/ui/view';
import { Button } from '../../../../../components/ui/Button';
import { Badge } from '../../../../../components/ui/Badge';
import { Card } from '../../../../../components/ui/card';
import { CardEmpty } from '../../../../../components/cards/CardEmpty';
import { CardError } from '../../../../../components/cards/CardError';
import { RefreshableStateContainer } from '../../../../../components/ui/RefreshableStateContainer';
import { ImageWithFallback } from '../../../../../components/utils/ImageWithFallback';
import { IconMediaRating } from '../../../../../components/medias/IconMediaRating';
import { Icons } from '../../../../../constants/Icons';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { useAuth } from '../../../../../providers/AuthProvider';
import { useSelectionField } from '../../../../../stores/useSelectionStore/useSelectionField';
import { getTmdbImage } from '../../../../../lib/tmdb/getTmdbImage';
import tw from '../../../../../lib/tw';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { LegendList } from '@legendapp/list/react-native';
import { Accordion } from '../../../../../components/ui/accordion';

type ReviewResolution = 'keep_existing' | 'use_imported';
type ConflictResolution = ReviewResolution | 'merge';

const SettingsDataImportLogMoviesScreen = () => {
  const t = useTranslations();
  const { isLiquidGlassAvailable } = useTheme();
  const insets = useSafeAreaInsets();
  const navigationHeaderHeight = useHeaderHeight();
  const { import_id } = useLocalSearchParams<{ import_id: string }>();
  const jobId = Number(import_id);

  const { data, isLoading, isError, isRefetching, refetch, hasNextPage, fetchNextPage } =
    useInfiniteQuery(importLogMoviesInfiniteOptions({ id: jobId }));
  const items = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const renderItem = useCallback(
    ({ item }: { item: ImportJobLogMovie }) => <LogMovieCard jobId={jobId} item={item} />,
    [jobId],
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: upperFirst(t('pages.settings.data.importer.categories.log_movies')),
          headerTransparent: true,
          ...(isLiquidGlassAvailable
            ? {
                headerStyle: { backgroundColor: 'transparent' },
              }
            : {}),
        }}
      />
      {isLoading ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <Icons.Loader />
        </RefreshableStateContainer>
      ) : isError ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <CardError />
        </RefreshableStateContainer>
      ) : items.length === 0 ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <CardEmpty icon={Icons.Movie} label={upperFirst(t('common.messages.no_results'))} />
        </RefreshableStateContainer>
      ) : (
        <LegendList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isRefetching}
          onRefresh={refetch}
          onEndReached={() => hasNextPage && fetchNextPage()}
          contentContainerStyle={{
            gap: GAP,
            paddingHorizontal: PADDING_HORIZONTAL,
            paddingTop: navigationHeaderHeight,
            paddingBottom: insets.bottom + PADDING_VERTICAL,
          }}
        />
      )}
    </>
  );
};

const LogMovieCard = ({ jobId, item }: { jobId: number; item: ImportJobLogMovie }) => {
  const t = useTranslations();
  const { colors } = useTheme();
  const { user } = useAuth();
  const patchMutation = useImportPatchLogMovieMutation();
  const isSkipped = useMemo(() => item.matchStatus === 'skipped', [item.matchStatus]);
  const isUnmatched = useMemo(() => item.matchStatus === 'unmatched', [item.matchStatus]);

  const { data: existingLog } = useQuery({
    ...movieLogOptions({ userId: user?.id, movieId: item.movieId ?? undefined }),
    enabled: !isSkipped && !!user?.id && !!item.movieId,
  });

  const hasConflict = !isSkipped && !!existingLog;
  const resolution: ConflictResolution = item.resolution ?? 'keep_existing';

  let finalRating = item.importedRating;
  let discardedRating: number | null = null;
  let finalIsLiked = item.importedIsLiked;

  if (hasConflict && existingLog) {
    const keepsExisting =
      resolution === 'keep_existing' || (resolution === 'merge' && existingLog.rating != null);
    finalRating = keepsExisting ? existingLog.rating : item.importedRating;
    discardedRating = keepsExisting ? item.importedRating : existingLog.rating;
    finalIsLiked = existingLog.isLiked || item.importedIsLiked;
  }

  const setResolution = useCallback(
    (value: ConflictResolution) => {
      patchMutation.mutate({ path: { id: jobId, itemId: item.id }, body: { resolution: value } });
    },
    [patchMutation, jobId, item.id],
  );

  const { openSelector } = useSelectionField(
    'movie',
    (movie) => {
      patchMutation.mutate({
        path: { id: jobId, itemId: item.id },
        body: { movieId: movie.id },
      });
    },
    item.id,
  );

  const handleMatch = useCallback(() => {
    openSelector({
      pathname: '/settings/data/import/[import_id]/select-movie',
      params: { import_id: String(jobId) },
    });
  }, [openSelector, jobId]);

  const handleToggleSkip = useCallback(() => {
    if (isSkipped) {
      if (item.movieId) {
        patchMutation.mutate({
          path: { id: jobId, itemId: item.id },
          body: { movieId: item.movieId },
        });
      } else {
        patchMutation.mutate({
          path: { id: jobId, itemId: item.id },
          body: { matchStatus: 'unmatched' },
        });
      }
    } else {
      patchMutation.mutate({
        path: { id: jobId, itemId: item.id },
        body: { matchStatus: 'skipped' },
      });
    }
  }, [isSkipped, patchMutation, jobId, item.id, item.movieId]);

  return (
    <Card style={{ ...tw`p-0`, ...(isSkipped || isUnmatched ? { opacity: 0.5 } : {}) }}>
      <Accordion
        title={
          <View style={tw`flex-row items-center justify-between gap-2`}>
            <View style={tw`flex-1 flex-row items-center gap-2 shrink`}>
              {isUnmatched || !item.movie ? (
                <>
                  <View>
                    <Text numberOfLines={2} style={tw`font-medium`}>
                      {item.rawTitle}
                    </Text>
                    {item.rawYear && <Text style={tw`text-sm`}>{item.rawYear}</Text>}
                  </View>
                  <Badge variant="destructive" style={tw`self-center`}>
                    {upperFirst(t('pages.settings.data.importer.no_match'))}
                  </Badge>
                </>
              ) : (
                <>
                  <ImageWithFallback
                    source={{ uri: getTmdbImage({ path: item.movie?.posterPath, size: 'w185' }) }}
                    alt={item.movie?.title ?? item.rawTitle}
                    type="movie"
                    style={{ width: 45, aspectRatio: 2 / 3 }}
                  />
                  <View style={tw`shrink gap-1`}>
                    <Text numberOfLines={2} style={tw`font-medium`}>
                      {item.movie?.title ?? item.rawTitle}
                    </Text>
                    {item.movie ? (
                      item.movie.releaseDate && (
                        <Text textColor="muted" style={tw`text-sm`}>
                          {new Date(item.movie.releaseDate).getFullYear()}
                        </Text>
                      )
                    ) : (
                      <Badge variant="destructive" style={tw`self-start`}>
                        {upperFirst(t('pages.settings.data.importer.no_match'))}
                      </Badge>
                    )}
                  </View>
                </>
              )}
            </View>
            {!isSkipped && (
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`gap-1`}>
                  <IconMediaRating rating={finalRating} />
                  {discardedRating != null && (
                    <IconMediaRating rating={discardedRating} style={{ opacity: 0.5 }} />
                  )}
                </View>
                {finalIsLiked && (
                  <Icons.Likes color={colors.accentPink} fill={colors.accentPink} size={15} />
                )}
              </View>
            )}
          </View>
        }
        containerStyle={tw`p-2`}
      >
        <View style={tw`pt-2 gap-3`}>
          <View style={tw`flex-row items-center justify-between gap-2`}>
            <Button
              variant="outline"
              icon={Icons.Puzzle}
              onPress={handleMatch}
              containerStyle={tw`shrink flex-1`}
            >
              {upperFirst(t('common.messages.fix'))}
            </Button>
            {!isUnmatched && (
              <Button
                variant="outline"
                icon={isSkipped ? Icons.Undo : Icons.X}
                onPress={handleToggleSkip}
                containerStyle={tw`shrink flex-1`}
              >
                {isSkipped
                  ? upperFirst(t('common.messages.restore'))
                  : upperFirst(t('common.messages.skip'))}
              </Button>
            )}
          </View>

          {hasConflict && (
            <View style={tw`gap-2`}>
              <View style={tw`flex-row items-center gap-2`}>
                <Button
                  variant={resolution === 'keep_existing' ? 'default' : 'outline'}
                  icon={Icons.X}
                  onPress={() => setResolution('keep_existing')}
                  containerStyle={tw`shrink flex-1`}
                />
                <Button
                  variant={resolution === 'use_imported' ? 'default' : 'outline'}
                  icon={Icons.Check}
                  onPress={() => setResolution('use_imported')}
                  containerStyle={tw`shrink flex-1`}
                />
                <Button
                  variant={resolution === 'merge' ? 'default' : 'outline'}
                  icon={Icons.Merge}
                  onPress={() => setResolution('merge')}
                  containerStyle={tw`shrink flex-1`}
                />
              </View>
            </View>
          )}
          {!isSkipped && item.review && (
            <LogMovieReviewCard
              jobId={jobId}
              item={item}
              hasExistingReview={!!existingLog?.review}
            />
          )}
        </View>
      </Accordion>
    </Card>
  );
};

const LogMovieReviewCard = ({
  jobId,
  item,
  hasExistingReview,
}: {
  jobId: number;
  item: ImportJobLogMovie;
  hasExistingReview: boolean;
}) => {
  const t = useTranslations();
  const patchReviewMutation = useImportPatchLogMovieReviewMutation();
  const review = item.review;
  if (!review) return null;

  const resolution: ReviewResolution =
    review.resolution === 'use_imported' || review.resolution === 'keep_existing'
      ? review.resolution
      : hasExistingReview
        ? 'keep_existing'
        : 'use_imported';

  const setResolution = (value: ReviewResolution) => {
    patchReviewMutation.mutate({
      path: { id: jobId, itemId: item.id },
      body: { resolution: value },
    });
  };

  return (
    <Card style={tw`p-2 gap-2`}>
      <View style={{ opacity: resolution === 'keep_existing' ? 0.5 : 1 }}>
        <Text
          style={[tw`text-sm font-medium`, { opacity: resolution === 'keep_existing' ? 0.5 : 1 }]}
        >
          {upperFirst(t('common.messages.review', { count: 1 }))}
        </Text>
        <Text textColor="muted" style={tw`text-sm`} numberOfLines={3}>
          {review.body}
        </Text>
      </View>
      <View style={tw`flex-row items-center justify-end gap-2`}>
        <Button
          icon={Icons.X}
          variant={resolution === 'keep_existing' ? 'default' : 'outline'}
          onPress={() => setResolution('keep_existing')}
          containerStyle={tw`shrink flex-1`}
        />
        <Button
          icon={Icons.Check}
          variant={resolution === 'use_imported' ? 'default' : 'outline'}
          onPress={() => setResolution('use_imported')}
          containerStyle={tw`shrink flex-1`}
        />
      </View>
    </Card>
  );
};

export default SettingsDataImportLogMoviesScreen;
