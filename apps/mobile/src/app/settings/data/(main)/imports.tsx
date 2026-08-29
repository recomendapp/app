import { Badge } from '../../../../components/ui/Badge';
import { Text } from '../../../../components/ui/text';
import { View } from '../../../../components/ui/view';
import { CardEmpty } from '../../../../components/cards/CardEmpty';
import { CardError } from '../../../../components/cards/CardError';
import { RefreshableStateContainer } from '../../../../components/ui/RefreshableStateContainer';
import { useToast } from '../../../../components/Toast';
import { Icons } from '../../../../constants/Icons';
import { useTheme } from '../../../../providers/ThemeProvider';
import { GAP, PADDING_HORIZONTAL, PADDING_VERTICAL } from '../../../../theme/globals';
import tw from '../../../../lib/tw';
import { ImportJob } from '@libs/api-js';
import { importsListInfiniteOptions, useImportDeleteMutation } from '@libs/query-client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import { Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormatter, useTranslations } from 'use-intl';
import SwipeableMonoActionRow from '../../../../components/ui/swippeable/SwipeableMonoActionRow';
import Animated, { LinearTransition, SlideOutLeft } from 'react-native-reanimated';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { parseApiDate } from '../../../../utils/parseApiDate';
import { useImporter } from '../../../../hooks/useImporter';

const SettingsDataImportsScreen = () => {
  const t = useTranslations();
  const format = useFormatter();
  const router = useRouter();
  const toast = useToast();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { getImporterStatusBadgeVariant, getImporterStatusLabel } = useImporter();

  const { data, isLoading, isRefetching, refetch, hasNextPage, fetchNextPage, isError } =
    useInfiniteQuery(importsListInfiniteOptions());
  const jobs = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const { mutateAsync: deleteImport } = useImportDeleteMutation();

  const handleOpen = useCallback(
    (job: ImportJob) => {
      router.push({
        pathname: '/settings/data/import/[import_id]',
        params: { import_id: String(job.id) },
      });
    },
    [router],
  );

  const handleDelete = useCallback(
    (job: ImportJob) => {
      Alert.alert(
        upperFirst(t('common.messages.are_u_sure')),
        upperFirst(t('pages.settings.data.importer.delete_confirm_description')),
        [
          { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
          {
            text: upperFirst(t('common.messages.delete')),
            style: 'destructive',
            onPress: async () => {
              await deleteImport(
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
    },
    [deleteImport, t, toast, mode],
  );

  const renderItem = useCallback(
    ({ item }: { item: ImportJob }) => (
      <Animated.View exiting={SlideOutLeft.duration(250)}>
        <SwipeableMonoActionRow
          rightAction={{
            type: 'open',
            icon: <Icons.Delete color={colors.destructiveForeground} />,
            backgroundColor: colors.destructive,
            onOpen: () => handleDelete(item),
          }}
          childrenContainerStyle={{
            paddingHorizontal: PADDING_HORIZONTAL,
          }}
        >
          <Pressable
            onPress={() => handleOpen(item)}
            style={[
              tw`flex-row items-center justify-between rounded-xl p-3`,
              { backgroundColor: colors.muted },
            ]}
          >
            <View style={tw`flex-row items-center gap-2 shrink`}>
              {(item.status === 'pending' || item.status === 'processing') && (
                <Icons.Loader size="small" color={colors.mutedForeground} />
              )}
              <View style={tw`shrink`}>
                <Text style={tw`font-medium`} numberOfLines={1}>
                  {upperFirst(item.provider)}
                </Text>
                <Text textColor="muted" style={tw`text-xs`}>
                  {format.relativeTime(parseApiDate(item.createdAt), new Date())}
                </Text>
              </View>
            </View>
            <View style={tw`flex-row items-center gap-2 shrink-0`}>
              <Badge variant={getImporterStatusBadgeVariant(item.status)}>
                {getImporterStatusLabel(item.status)}
              </Badge>
            </View>
          </Pressable>
        </SwipeableMonoActionRow>
      </Animated.View>
    ),
    [
      colors,
      format,
      handleOpen,
      handleDelete,
      getImporterStatusBadgeVariant,
      getImporterStatusLabel,
    ],
  );

  return (
    <>
      {isLoading ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <Icons.Loader />
        </RefreshableStateContainer>
      ) : isError ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <CardError />
        </RefreshableStateContainer>
      ) : jobs.length === 0 ? (
        <RefreshableStateContainer onRefresh={refetch} refreshing={isRefetching}>
          <CardEmpty icon={Icons.Database} label={t('pages.settings.data.importer.empty')} />
        </RefreshableStateContainer>
      ) : (
        <AnimatedLegendList
          data={jobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          itemLayoutAnimation={LinearTransition.duration(280)}
          refreshing={isRefetching}
          onRefresh={refetch}
          onEndReached={() => hasNextPage && fetchNextPage()}
          contentContainerStyle={[
            {
              gap: GAP,
              paddingTop: PADDING_VERTICAL,
              paddingBottom: insets.bottom + PADDING_VERTICAL,
            },
          ]}
        />
      )}
    </>
  );
};

export default SettingsDataImportsScreen;
