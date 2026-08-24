'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { ImportJobLogTvSeries } from '@libs/api-js';
import { tvSeriesLogOptions, useImportPatchLogTvSeriesMutation } from '@libs/query-client';
import { Button } from '@/components/ui/button';
import { HeartIcon, Undo2Icon, XIcon } from 'lucide-react';
import { IconMediaRating } from '@/components/Media/icons/IconMediaRating';
import { useAuth } from '@/context/auth-context';
import { MediaPreview } from '../../MediaPreview';
import { MediaMatchPicker } from '../../MediaMatchPicker';
import { ReviewInlineReview } from '../../ReviewInlineReview';
import { ReviewInlineConflict } from '../../ReviewInlineConflict';

export const LogTvSeriesColumns = (jobId: number): ColumnDef<ImportJobLogTvSeries>[] => {
  const t = useTranslations();

  return [
    {
      id: 'media',
      header: upperFirst(t('common.messages.item', { count: 1 })),
      size: 5,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <MediaPreview
            title={item.tvSeries?.name}
            posterPath={item.tvSeries?.posterPath}
            date={item.tvSeries?.firstAirDate}
            rawTitle={item.rawTitle}
            rawYear={item.rawYear}
          />
        );
      },
    },
    {
      id: 'log',
      header: upperFirst(t('pages.settings.data.importer.log_column')),
      size: 3,
      cell: ({ row }) => <LogCell jobId={jobId} item={row.original} />,
    },
    {
      id: 'actions',
      header: upperFirst(t('pages.settings.data.importer.actions_column')),
      size: 1,
      cell: ({ row }) => <ActionsCell jobId={jobId} item={row.original} />,
    },
  ];
};

function LogCell({ jobId, item }: { jobId: number; item: ImportJobLogTvSeries }) {
  const { user } = useAuth();
  const patchMutation = useImportPatchLogTvSeriesMutation();
  const isSkipped = item.matchStatus === 'skipped';

  const { data: existingLog } = useQuery({
    ...tvSeriesLogOptions({ userId: user?.id, tvSeriesId: item.tvSeriesId ?? undefined }),
    enabled: !isSkipped && !!user?.id && !!item.tvSeriesId,
  });

  const hasConflict = !isSkipped && !!existingLog;
  const resolution = item.resolution ?? 'keep_existing';

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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-start gap-1">
            <IconMediaRating rating={finalRating} />
            {discardedRating != null && (
              <IconMediaRating rating={discardedRating} className="opacity-50" />
            )}
          </div>
          {finalIsLiked && <HeartIcon size={15} className="text-accent-pink fill-accent-pink" />}
        </div>
        {hasConflict && (
          <ReviewInlineConflict
            resolution={resolution}
            onResolutionChange={(resolution) =>
              patchMutation.mutate({ path: { id: jobId, itemId: item.id }, body: { resolution } })
            }
          />
        )}
      </div>
      {!isSkipped && (
        <ReviewInlineReview
          jobId={jobId}
          type="tv_series"
          item={item}
          hasExistingReview={!!existingLog?.review}
        />
      )}
    </div>
  );
}

function ActionsCell({ jobId, item }: { jobId: number; item: ImportJobLogTvSeries }) {
  const patchMutation = useImportPatchLogTvSeriesMutation();
  const isSkipped = item.matchStatus === 'skipped';

  const handleUndo = () => {
    if (item.tvSeriesId) {
      patchMutation.mutate({
        path: { id: jobId, itemId: item.id },
        body: { tvSeriesId: item.tvSeriesId },
      });
    } else {
      patchMutation.mutate({
        path: { id: jobId, itemId: item.id },
        body: { matchStatus: 'unmatched' },
      });
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <MediaMatchPicker
        type="tv_series"
        onSelect={(tvSeriesId) =>
          patchMutation.mutate({ path: { id: jobId, itemId: item.id }, body: { tvSeriesId } })
        }
      />
      {isSkipped ? (
        <Button variant="ghost" size="icon" onClick={handleUndo}>
          <Undo2Icon size={15} />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            patchMutation.mutate({
              path: { id: jobId, itemId: item.id },
              body: { matchStatus: 'skipped' },
            })
          }
        >
          <XIcon size={15} />
        </Button>
      )}
    </div>
  );
}
