import { WatchedDate } from '@libs/api-js';
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'use-intl';

const WATCHED_DATE_FORMATS: WatchedDate['format'][] = [
  'theater',
  'physical',
  'digital',
  'streaming',
  'other',
];

export const useWatchedDateFormats = () => {
  const t = useTranslations();

  const getWatchedDateFormatLabel = useCallback(
    (format: WatchedDate['format']): string => {
      switch (format) {
        case 'theater':
          return t('common.messages.theater');
        case 'physical':
          return t('common.messages.physical');
        case 'digital':
          return t('common.messages.digital');
        case 'streaming':
          return t('common.messages.streaming');
        case 'other':
        default:
          return t('common.messages.other', { count: 1 });
      }
    },
    [t],
  );

  const watchedDateFormatValues = useMemo(() => {
    return WATCHED_DATE_FORMATS.map((format) => ({
      value: format,
      label: getWatchedDateFormatLabel(format),
    }));
  }, [getWatchedDateFormatLabel]);

  return {
    getWatchedDateFormatLabel,
    watchedDateFormatValues,
  };
};
