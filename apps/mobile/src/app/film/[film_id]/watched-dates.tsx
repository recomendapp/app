import { LegendList } from '@legendapp/list/react-native';
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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { upperFirst } from 'lodash';
import { useCallback, useMemo } from 'react';
import { Pressable } from 'react-native';
import { useTranslations } from 'use-intl';

const FilmWatchedDatesScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const { film_id } = useLocalSearchParams<{ film_id: string }>();
  const { id: movieId } = getIdFromSlug(film_id);
  const toast = useToast();
  const openSheet = useBottomSheetStore((state) => state.openSheet);
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
  const { mutateAsync: deleteWatchedDate } = useMovieWatchedDateDeleteMutation();

  const modalHeaderOptions = useModalHeaderOptions({
    forceCross: true,
  });

  // Handlers
  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);
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

  const handleSelectDate = useCallback(
    (currentDate?: WatchedDate) => {
      openSheet(BottomSheetSelectDate, {
        ...(currentDate
          ? ({
              defaultDate: new Date(currentDate.watchedDate),
              onSave: (newDate) =>
                handleUpdateWatchedDate({
                  ...currentDate,
                  watchedDate: newDate.toISOString(),
                } as WatchedDate),
            } as const)
          : {
              onSave: handleAddWatchedDate,
            }),
      });
    },
    [openSheet, handleAddWatchedDate, handleUpdateWatchedDate],
  );

  // Render
  const renderItem = useCallback(({ item }: { item: WatchedDate }) => {
    return (
      <Pressable
        onPress={() => handleSelectDate(item)}
        style={tw`py-2 px-4 border-b border-divider`}
      >
        <Text>{new Date(item.watchedDate).toLocaleDateString()}</Text>
      </Pressable>
    );
  }, []);

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
      <LegendList
        data={watchedDates}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
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
        onRefresh={refetch}
        onEndReached={() => hasNextPage && fetchNextPage()}
      />
    </>
  );
};

export default FilmWatchedDatesScreen;
