import { WatchedDate } from '@libs/api-js';
import {
  useMovieWatchedDateDeleteMutation,
  useMovieWatchedDateSetMutation,
  useMovieWatchedDateUpdateMutation,
  userMovieWatchedDatesInfiniteOptions,
} from '@libs/query-client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { BottomSheetSelectDate } from '../../../components/bottom-sheets/sheets/BottomSheetSelectDate';
import { useToast } from '../../../components/Toast';
import { Button } from '../../../components/ui/Button';
import { Text } from '../../../components/ui/text';
import { View } from '../../../components/ui/view';
import { Icons } from '../../../constants/Icons';
import { useModalHeaderOptions } from '../../../hooks/useModalHeaderOptions';
import tw from '../../../lib/tw';
import { useAuth } from '../../../providers/AuthProvider';
import useBottomSheetStore from '../../../stores/useBottomSheetStore';
import { getIdFromSlug } from '../../../utils/getIdFromSlug';
import { Stack, useLocalSearchParams } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useFormatter, useNow, useTranslations } from 'use-intl';
import SwipeableMonoActionRow from '../../../components/ui/swippeable/SwipeableMonoActionRow';
import { useTheme } from '../../../providers/ThemeProvider';
import Animated, { LinearTransition, SlideOutLeft } from 'react-native-reanimated';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { Card } from '../../../components/ui/card';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useWatchedDateFormats } from '../../../hooks/useWatchedDateFormats';
import { PADDING_HORIZONTAL } from '../../../theme/globals';

const FilmWatchedDatesScreen = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const t = useTranslations();
  const now = useNow();
  const formatter = useFormatter();
  const { film_id } = useLocalSearchParams<{ film_id: string }>();
  const { id: movieId } = getIdFromSlug(film_id);
  const toast = useToast();
  const openSheet = useBottomSheetStore((state) => state.openSheet);
  const { showActionSheetWithOptions } = useActionSheet();
  const { getWatchedDateFormatLabel, watchedDateFormatValues } = useWatchedDateFormats();
  // Queries
  const { data, isLoading, refetch, hasNextPage, fetchNextPage } = useInfiniteQuery(
    userMovieWatchedDatesInfiniteOptions({
      userId: user?.id,
      movieId: movieId,
    }),
  );
  const watchedDates = useMemo(() => data?.pages.flatMap((page) => page.data) || [], [data]);
  // Mutations
  const { mutate: setWatchedDate } = useMovieWatchedDateSetMutation();
  const { mutate: updateWatchedDate } = useMovieWatchedDateUpdateMutation();
  const { mutate: deleteWatchedDate } = useMovieWatchedDateDeleteMutation();

  const modalHeaderOptions = useModalHeaderOptions({
    forceCross: true,
  });

  // Handlers
  const handleAddWatchedDate = useCallback(
    (date: Date) => {
      setWatchedDate(
        {
          path: {
            movie_id: movieId,
          },
          body: {
            watchedDate: date.toISOString(),
          },
        },
        {
          onError: () => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          },
        },
      );
    },
    [setWatchedDate, movieId, toast, t],
  );
  const handleUpdateWatchedDate = useCallback(
    (date: WatchedDate) => {
      updateWatchedDate(
        {
          path: {
            movie_id: movieId,
            watched_date_id: date.id,
          },
          body: {
            watchedDate: date.watchedDate,
            format: date.format,
          },
        },
        {
          onError: () => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          },
        },
      );
    },
    [updateWatchedDate, movieId, toast, t],
  );
  const handleDeleteWatchedDate = useCallback(
    (date: WatchedDate) => {
      deleteWatchedDate(
        {
          path: {
            movie_id: movieId,
            watched_date_id: date.id,
          },
        },
        {
          onError: () => {
            toast.error(upperFirst(t('common.messages.an_error_occurred')));
          },
        },
      );
    },
    [deleteWatchedDate, movieId, toast, t],
  );

  const handleSelectDate = useCallback(
    (currentDate?: WatchedDate) => {
      openSheet(BottomSheetSelectDate, {
        maxDate: now,
        ...(currentDate
          ? ({
              defaultDate: new Date(currentDate.watchedDate),
              onSave: (newDate) =>
                handleUpdateWatchedDate({
                  ...currentDate,
                  watchedDate: newDate.toISOString(),
                }),
            } as const)
          : {
              onSave: handleAddWatchedDate,
            }),
      });
    },
    [openSheet, handleAddWatchedDate, handleUpdateWatchedDate, now],
  );

  const handleSelectFormat = useCallback(
    (date: WatchedDate) => {
      const formatOptionsWithCancel = [
        ...watchedDateFormatValues,
        { value: 'cancel' as const, label: upperFirst(t('common.messages.cancel')) },
      ];
      const cancelIndex = formatOptionsWithCancel.length - 1;

      showActionSheetWithOptions(
        {
          title: upperFirst(t('common.messages.select_format')),
          options: formatOptionsWithCancel.map((option) => option.label),
          cancelButtonIndex: cancelIndex,
        },
        (selectedIndex) => {
          if (selectedIndex === undefined || selectedIndex === cancelIndex) return;

          const selectedFormat = watchedDateFormatValues[selectedIndex].value;
          if (selectedFormat === date.format) return;

          handleUpdateWatchedDate({ ...date, format: selectedFormat });
        },
      );
    },
    [watchedDateFormatValues, showActionSheetWithOptions, t, handleUpdateWatchedDate],
  );

  // Render
  const renderItem = useCallback(
    ({ item }: { item: WatchedDate }) => {
      return (
        <Animated.View exiting={SlideOutLeft.duration(250)}>
          <SwipeableMonoActionRow
            rightAction={{
              type: 'open',
              icon: <Icons.Delete color={colors.destructiveForeground} />,
              backgroundColor: 'transparent',
              onOpen: () => handleDeleteWatchedDate(item),
              autoClose: false,
            }}
          >
            <View style={{ paddingHorizontal: PADDING_HORIZONTAL }}>
              <Card style={tw`flex-row items-center justify-between gap-2`}>
                <Button variant="outline" onPress={() => handleSelectDate(item)}>
                  <Text>
                    {formatter.dateTime(new Date(item.watchedDate), { dateStyle: 'long' })}
                  </Text>
                </Button>
                <Button variant="outline" onPress={() => handleSelectFormat(item)}>
                  <Text>{getWatchedDateFormatLabel(item.format)}</Text>
                </Button>
              </Card>
            </View>
          </SwipeableMonoActionRow>
        </Animated.View>
      );
    },
    [
      handleDeleteWatchedDate,
      handleSelectDate,
      handleSelectFormat,
      getWatchedDateFormatLabel,
      colors,
      formatter,
    ],
  );

  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerRight: () => (
            <Button
              variant="ghost"
              icon={Icons.Add}
              size="icon"
              style={tw`rounded-full`}
              onPress={() => handleSelectDate()}
            />
          ),
          unstable_headerRightItems: () => [
            {
              type: 'button',
              label: upperFirst(t('common.messages.add')),
              onPress: handleSelectDate,
              icon: {
                name: 'plus',
                type: 'sfSymbol',
              },
            },
          ],
        }}
      />
      <AnimatedLegendList
        data={watchedDates}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        itemLayoutAnimation={LinearTransition.duration(280)}
        ListEmptyComponent={
          isLoading ? (
            <Icons.Loader />
          ) : (
            <View style={tw`flex-1 items-center justify-center p-4`}>
              <Text style={tw`text-center text-muted`}>
                {upperFirst(t('common.messages.no_watched_dates'))}
              </Text>
            </View>
          )
        }
        contentContainerStyle={tw`gap-2`}
        maintainVisibleContentPosition={false}
        onRefresh={refetch}
        onEndReached={() => hasNextPage && fetchNextPage()}
      />
    </>
  );
};

export default FilmWatchedDatesScreen;
