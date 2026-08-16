import { Alert } from 'react-native';
import { useAuth } from '../../../providers/AuthProvider';
import { Icons } from '../../../constants/Icons';
import { useTheme } from '../../../providers/ThemeProvider';
import { upperFirst } from 'lodash';
import tw from '../../../lib/tw';
import { useTranslations } from 'use-intl';
import { usePathname, useRouter } from 'expo-router';
import { Button } from '../../ui/Button';
import { useToast } from '../../Toast';
import { forwardRef, useCallback } from 'react';
import { TvSeriesCompact } from '@libs/api-js';
import { useQuery } from '@tanstack/react-query';
import {
  tvSeriesLogOptions,
  useTvSeriesLogDeleteMutation,
  useTvSeriesLogSetMutation,
} from '@libs/query-client';

interface ButtonUserLogTvSeriesWatchProps extends React.ComponentProps<typeof Button> {
  tvSeries: TvSeriesCompact;
}

const ButtonUserLogTvSeriesWatch = forwardRef<
  React.ComponentRef<typeof Button>,
  ButtonUserLogTvSeriesWatchProps
>(
  (
    {
      tvSeries,
      icon = Icons.Check,
      variant = 'outline',
      size = 'icon',
      style,
      onPress: onPressProps,
      ...props
    },
    ref,
  ) => {
    const toast = useToast();
    const { colors, mode } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations();
    const { data: log } = useQuery(
      tvSeriesLogOptions({
        userId: user?.id,
        tvSeriesId: tvSeries.id!,
      }),
    );
    const { mutateAsync: setLog } = useTvSeriesLogSetMutation();
    const { mutateAsync: unwatch } = useTvSeriesLogDeleteMutation();

    const onError = useCallback(() => {
      toast.error(upperFirst(t('common.messages.an_error_occurred')));
    }, [toast, t]);

    const handleSetInProgress = useCallback(async () => {
      await setLog(
        { path: { tv_series_id: tvSeries.id }, body: { status: 'watching' } },
        { onError },
      );
    }, [tvSeries.id, setLog, onError]);

    // Completing marks every episode of every season as watched — one-way, mirrors the web
    // ButtonLogTvSeriesWatch's confirm modal.
    const handleMarkAsCompleted = useCallback(() => {
      Alert.alert(
        upperFirst(t('common.messages.are_u_sure')),
        t('components.tv_series.actions.watch.complete.description'),
        [
          { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
          {
            text: upperFirst(t('common.messages.confirm')),
            onPress: async () => {
              await setLog(
                { path: { tv_series_id: tvSeries.id }, body: { status: 'completed' } },
                { onError },
              );
            },
          },
        ],
        { userInterfaceStyle: mode },
      );
    }, [tvSeries.id, setLog, onError, t, mode]);

    const handleUnwatch = useCallback(() => {
      Alert.alert(
        upperFirst(t('common.messages.are_u_sure')),
        upperFirst(t('components.media.actions.watch.remove_from_watched.description')),
        [
          { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
          {
            text: upperFirst(t('common.messages.confirm')),
            onPress: async () => {
              await unwatch({ path: { tv_series_id: tvSeries.id } }, { onError });
            },
            style: 'destructive',
          },
        ],
        { userInterfaceStyle: mode },
      );
    }, [tvSeries.id, unwatch, mode, onError, t]);

    // No log yet: only "in progress" / "complete" make sense. Already completed: status is
    // one-way, so the only thing left to offer is removing the log entirely.
    const handlePress = useCallback(() => {
      if (!log) {
        Alert.alert(
          upperFirst(t('common.messages.mark_as_watched')),
          undefined,
          [
            { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
            {
              text: upperFirst(t('common.messages.in_progress')),
              onPress: handleSetInProgress,
            },
            { text: upperFirst(t('common.messages.complete')), onPress: handleMarkAsCompleted },
          ],
          { userInterfaceStyle: mode },
        );
      } else if (log.status === 'completed') {
        handleUnwatch();
      } else {
        Alert.alert(
          upperFirst(t('common.messages.mark_as_watched')),
          undefined,
          [
            { text: upperFirst(t('common.messages.cancel')), style: 'cancel' },
            {
              text: upperFirst(t('common.messages.delete')),
              onPress: handleUnwatch,
              style: 'destructive',
            },
            { text: upperFirst(t('common.messages.complete')), onPress: handleMarkAsCompleted },
          ],
          { userInterfaceStyle: mode },
        );
      }
    }, [log, t, mode, handleSetInProgress, handleMarkAsCompleted, handleUnwatch]);

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        icon={log?.status === 'watching' ? Icons.Clock : icon}
        onPress={(e) => {
          if (user) {
            handlePress();
          } else {
            router.push({
              pathname: '/auth',
              params: {
                redirect: pathname,
              },
            });
          }
          onPressProps?.(e);
        }}
        style={{
          ...(log
            ? {
                backgroundColor:
                  log.status === 'watching' ? colors.accentOrange : colors.accentBlue,
              }
            : undefined),
          ...tw`rounded-full`,
          ...style,
        }}
        {...props}
      />
    );
  },
);
ButtonUserLogTvSeriesWatch.displayName = 'ButtonUserLogTvSeriesWatch';

export default ButtonUserLogTvSeriesWatch;
