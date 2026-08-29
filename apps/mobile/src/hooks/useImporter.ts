import { useCallback, useMemo } from 'react';
import { useTranslations } from 'use-intl';
import { ImportJob } from '@libs/api-js';
import { LucideProps } from 'lucide-react-native';
import { Icons } from '../constants/Icons';
import { BadgeProps } from '../components/ui/Badge';

const IMPORT_STATUS_VALUES: ImportJob['status'][] = [
  'awaiting_review',
  'completed',
  'failed',
  'pending',
  'processing',
];

export type ImporterStatusOption = {
  value: ImportJob['status'];
  label: string;
  badgeVariant: BadgeProps['variant'];
  icon?: React.ComponentType<LucideProps>;
};

export const useImporter = () => {
  const t = useTranslations();

  const getImporterStatusLabel = useCallback(
    (status: ImportJob['status']): string => {
      switch (status) {
        case 'failed':
          return t('common.messages.failed', { gender: 'male', count: 1 });
        case 'awaiting_review':
          return t('common.messages.awaiting_review');
        case 'pending':
          return t('common.messages.pending');
        case 'processing':
          return t('common.messages.processing');
        case 'completed':
          return t('common.messages.completed', { gender: 'male', count: 1 });
        default:
          return t('common.messages.unknown', { gender: 'male', count: 1 });
      }
    },
    [t],
  );

  const getImporterStatusIcon = useCallback(
    (usage: ImportJob['status']): React.ComponentType<LucideProps> => {
      switch (usage) {
        default:
          return Icons.info;
      }
    },
    [],
  );

  const getImporterStatusBadgeVariant = useCallback(
    (usage: ImportJob['status']): BadgeProps['variant'] => {
      switch (usage) {
        case 'failed':
          return 'destructive';
        case 'awaiting_review':
          return 'accent-yellow';
        case 'pending':
          return 'outline';
        case 'processing':
          return 'outline';
        case 'completed':
          return 'accent-yellow';
        default:
          return 'default';
      }
    },
    [],
  );

  const getImporterStatus = useCallback(
    (usage: ImportJob['status']): ImporterStatusOption => {
      return {
        value: usage,
        label: getImporterStatusLabel(usage),
        icon: getImporterStatusIcon(usage),
        badgeVariant: getImporterStatusBadgeVariant(usage),
      };
    },
    [getImporterStatusLabel, getImporterStatusIcon, getImporterStatusBadgeVariant],
  );

  const importerStatusValues = useMemo(() => {
    return IMPORT_STATUS_VALUES.map((usage): ImporterStatusOption => getImporterStatus(usage));
  }, [getImporterStatus]);

  return {
    getImporterStatusLabel,
    getImporterStatusIcon,
    getImporterStatusBadgeVariant,
    getImporterStatus,
    importerStatusValues,
  };
};
