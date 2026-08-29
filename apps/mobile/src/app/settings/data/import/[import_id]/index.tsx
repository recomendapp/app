import { Href, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'use-intl';
import { Alert } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  importBookmarksInfiniteOptions,
  importLogMoviesInfiniteOptions,
  importLogTvSeriesInfiniteOptions,
  importOptions,
  importPlaylistsInfiniteOptions,
  useImportValidateMutation,
} from '@libs/query-client';
import { Button } from '../../../../../components/ui/Button';
import { Text } from '../../../../../components/ui/text';
import { View } from '../../../../../components/ui/view';
import { CardError } from '../../../../../components/cards/CardError';
import { CardEmpty } from '../../../../../components/cards/CardEmpty';
import { RefreshableStateContainer } from '../../../../../components/ui/RefreshableStateContainer';
import { useToast } from '../../../../../components/Toast';
import { Icons } from '../../../../../constants/Icons';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { useImporter } from '../../../../../hooks/useImporter';
import tw from '../../../../../lib/tw';
import { useModalHeaderOptions } from '../../../../../hooks/useModalHeaderOptions';
import { ImportJob } from '@libs/api-js';
import { LegendList } from '@legendapp/list/react-native';
import { PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../../theme/globals';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingFooter } from '../../../../../components/ui/FloatingFooter';
import { Card } from '../../../../../components/ui/card';
import { useHeaderHeight } from 'expo-router/react-navigation';

type Category = {
  key: string;
  label: string;
  count: number;
  href: Href;
};

const ImportList = ({ job }: { job: ImportJob }) => {
  const t = useTranslations();
  const router = useRouter();
  const toast = useToast();
  const navigationHeaderHeight = useHeaderHeight();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { mutate: validateImport, isPending: isValidating } = useImportValidateMutation();
  const hasFooter = useMemo(() => job.status === 'awaiting_review', [job.status]);
  const { data: logMovies } = useInfiniteQuery({
    ...importLogMoviesInfiniteOptions({ id: job.id, filters: { include_total_count: true } }),
    enabled: job.status === 'awaiting_review' || job.status === 'completed',
  });
  const { data: logTvSeries } = useInfiniteQuery({
    ...importLogTvSeriesInfiniteOptions({ id: job.id, filters: { include_total_count: true } }),
    enabled: job.status === 'awaiting_review' || job.status === 'completed',
  });
  const { data: bookmarks } = useInfiniteQuery({
    ...importBookmarksInfiniteOptions({ id: job.id, filters: { include_total_count: true } }),
    enabled: job.status === 'awaiting_review' || job.status === 'completed',
  });
  const { data: playlists } = useInfiniteQuery({
    ...importPlaylistsInfiniteOptions({ id: job.id, filters: { include_total_count: true } }),
    enabled: job.status === 'awaiting_review' || job.status === 'completed',
  });
  const categories = useMemo(
    (): Category[] => [
      ...((logMovies?.pages[0]?.meta.total_results ?? 0) > 0
        ? ([
            {
              key: 'log-movies',
              label: t('pages.settings.data.importer.categories.log_movies'),
              href: {
                pathname: '/settings/data/import/[import_id]/log-movies',
                params: { import_id: job.id },
              },
              count: logMovies?.pages[0]?.meta.total_results ?? 0,
            },
          ] as const)
        : []),
      ...((logTvSeries?.pages[0]?.meta.total_results ?? 0) > 0
        ? ([
            {
              key: 'log-tv-series',
              label: t('pages.settings.data.importer.categories.log_tv_series'),
              href: {
                pathname: '/settings/data/import/[import_id]/log-tv-series',
                params: { import_id: job.id },
              },
              count: logTvSeries?.pages[0]?.meta.total_results ?? 0,
            },
          ] as const)
        : []),
      ...((bookmarks?.pages[0]?.meta.total_results ?? 0) > 0
        ? ([
            {
              key: 'bookmarks',
              label: t('pages.settings.data.importer.categories.bookmarks'),
              href: {
                pathname: '/settings/data/import/[import_id]/bookmarks',
                params: { import_id: job.id },
              },
              count: bookmarks?.pages[0]?.meta.total_results ?? 0,
            },
          ] as const)
        : []),
      ...((playlists?.pages[0]?.meta.total_results ?? 0) > 0
        ? ([
            {
              key: 'playlists',
              label: t('pages.settings.data.importer.categories.playlists'),
              href: {
                pathname: '/settings/data/import/[import_id]/playlists',
                params: { import_id: job.id },
              },
              count: playlists?.pages[0]?.meta.total_results ?? 0,
            },
          ] as const)
        : []),
    ],
    [t, logMovies, logTvSeries, bookmarks, playlists, job.id],
  );

  const renderItem = useCallback(
    ({ item }: { item: Category }) => (
      <Button
        variant="ghost"
        size="fit"
        onPress={() => router.push(item.href)}
        style={[
          {
            paddingVertical: PADDING_HORIZONTAL,
            paddingHorizontal: PADDING_HORIZONTAL,
          },
        ]}
      >
        <View style={tw`flex-1 flex-row items-center justify-between`}>
          <Text>{item.label}</Text>
          <View style={tw`flex-row items-center gap-2`}>
            <Text textColor="muted">{item.count}</Text>
            <Icons.ChevronRight color={colors.mutedForeground} size={16} />
          </View>
        </View>
      </Button>
    ),
    [colors.mutedForeground, router],
  );

  const handleValidate = useCallback(() => {
    Alert.alert(
      upperFirst(t('common.messages.are_u_sure')),
      upperFirst(t('pages.settings.data.importer.validate_confirm_description')),
      [
        { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
        {
          text: upperFirst(t('pages.settings.data.importer.validate')),
          onPress: () => {
            validateImport(
              { id: job.id },
              {
                onError: () => {
                  toast.error(upperFirst(t('common.messages.error')), {
                    description: upperFirst(t('common.messages.an_error_occurred')),
                  });
                },
              },
            );
          },
        },
      ],
      { userInterfaceStyle: mode },
    );
  }, [job.id, validateImport, t, toast, mode]);

  return (
    <>
      <LegendList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        ItemSeparatorComponent={() => (
          <View style={[{ backgroundColor: colors.muted, height: 1 }, tw` w-full`]} />
        )}
        ListHeaderComponent={() =>
          job.status === 'completed' ? (
            <View style={{ paddingHorizontal: PADDING_HORIZONTAL }}>
              <Card style={tw`items-center gap-2`}>
                <Icons.SuccessCircle color={colors.accentGreen} size={48} />
                <Text textColor="muted" style={tw`text-center max-w-xs`}>
                  {upperFirst(t('pages.settings.data.importer.success_description'))}
                </Text>
              </Card>
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingTop: navigationHeaderHeight,
          paddingBottom: !hasFooter ? insets.bottom + PADDING_VERTICAL : 0,
        }}
      />
      {hasFooter && (
        <FloatingFooter>
          <Button
            variant="outline"
            size="lg"
            containerStyle={tw`w-full`}
            loading={isValidating}
            onPress={handleValidate}
          >
            {upperFirst(t('pages.settings.data.importer.validate'))}
          </Button>
        </FloatingFooter>
      )}
    </>
  );
};

const SettingsDataImportDetailScreen = () => {
  const t = useTranslations();
  const modalHeaderOptions = useModalHeaderOptions();
  const { colors, isLiquidGlassAvailable } = useTheme();
  const { getImporterStatusLabel } = useImporter();
  const { import_id } = useLocalSearchParams<{ import_id: string }>();

  const {
    data: job,
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useQuery(importOptions(Number(import_id)));

  const headerTitle = useMemo(() => {
    if (!job) return upperFirst(t('common.messages.import'));
    switch (job.status) {
      case 'awaiting_review':
        return upperFirst(t('pages.settings.data.importer.review_title'));
      case 'completed':
        return upperFirst(t('pages.settings.data.importer.success_title'));
      case 'failed':
        return upperFirst(t('pages.settings.data.importer.failed_title'));
      case 'pending':
      case 'processing':
      default:
        return upperFirst(getImporterStatusLabel(job.status));
    }
  }, [job, t, getImporterStatusLabel]);

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerTitle,
          headerTransparent: true,
          ...(isLiquidGlassAvailable
            ? {
                headerStyle: { backgroundColor: 'transparent' },
              }
            : {}),
        }}
      />
      {job?.status === 'awaiting_review' || job?.status === 'completed' ? (
        <ImportList job={job} />
      ) : (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          {isLoading ? (
            <Icons.Loader />
          ) : isError || !job ? (
            <CardError />
          ) : job.status === 'processing' ? (
            <View style={tw`items-center gap-3`}>
              <Icons.Loader color={colors.mutedForeground} size="large" />
              <Text textColor="muted" style={tw`text-center max-w-xs`}>
                {upperFirst(t('pages.settings.data.importer.processing'))}
              </Text>
            </View>
          ) : job.status === 'failed' ? (
            <View style={tw`items-center gap-3`}>
              <Icons.AlertCircle color={colors.destructive} size={48} />
              <Text textColor="muted" style={tw`text-center max-w-xs`}>
                {job.error || upperFirst(t('pages.settings.data.importer.failed_description'))}
              </Text>
            </View>
          ) : job.status === 'pending' ? (
            <CardEmpty
              icon={Icons.Clock}
              label={upperFirst(t('pages.settings.data.importer.pending_description'))}
            />
          ) : (
            <CardEmpty
              icon={Icons.AlertCircle}
              label={upperFirst(t('common.messages.unknown', { gender: 'male', count: 1 }))}
            />
          )}
        </RefreshableStateContainer>
      )}
    </>
  );
};

export default SettingsDataImportDetailScreen;
