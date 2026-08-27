'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { ImportJobPlaylistItem } from '@libs/api-js';
import { useImportPatchPlaylistItemMutation } from '@libs/query-client';
import { Badge } from '@libs/ui/components/badge';
import { Button } from '@libs/ui/components/button';
import { Undo2Icon, XIcon } from 'lucide-react';
import { MediaPreview } from '../../MediaPreview';
import { MediaMatchPicker } from '../../MediaMatchPicker';

export const PlaylistItemColumns = (
  jobId: number,
  playlistId: number,
): ColumnDef<ImportJobPlaylistItem>[] => {
  const t = useTranslations();

  return [
    {
      id: 'order',
      header: '#',
      size: 1,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.sourceOrder}</span>
      ),
    },
    {
      id: 'media',
      header: upperFirst(t('common.messages.item', { count: 1 })),
      size: 6,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <MediaPreview
            title={item.type === 'movie' ? item.movie?.title : item.tvSeries?.name}
            posterPath={item.type === 'movie' ? item.movie?.posterPath : item.tvSeries?.posterPath}
            date={item.type === 'movie' ? item.movie?.releaseDate : item.tvSeries?.firstAirDate}
            rawTitle={item.rawTitle}
            rawYear={item.rawYear}
          />
        );
      },
    },
    {
      id: 'type',
      header: upperFirst(t('common.messages.type')),
      size: 2,
      cell: ({ row }) => (
        <Badge variant={row.original.type}>
          {t(`common.messages.${row.original.type}`, { count: 1 })}
        </Badge>
      ),
    },
    {
      id: 'actions',
      size: 1,
      cell: ({ row }) => <ActionsCell jobId={jobId} playlistId={playlistId} item={row.original} />,
    },
  ];
};

function ActionsCell({
  jobId,
  playlistId,
  item,
}: {
  jobId: number;
  playlistId: number;
  item: ImportJobPlaylistItem;
}) {
  const patchMutation = useImportPatchPlaylistItemMutation();
  const isSkipped = item.matchStatus === 'skipped';

  const handleUndo = () => {
    if (item.type === 'movie' && item.movieId) {
      patchMutation.mutate({
        path: { id: jobId, playlistId, itemId: item.id },
        body: { movieId: item.movieId },
      });
    } else if (item.type === 'tv_series' && item.tvSeriesId) {
      patchMutation.mutate({
        path: { id: jobId, playlistId, itemId: item.id },
        body: { tvSeriesId: item.tvSeriesId },
      });
    } else {
      patchMutation.mutate({
        path: { id: jobId, playlistId, itemId: item.id },
        body: { matchStatus: 'unmatched' },
      });
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <MediaMatchPicker
        type={item.type}
        onSelect={(id) =>
          patchMutation.mutate({
            path: { id: jobId, playlistId, itemId: item.id },
            body: item.type === 'movie' ? { movieId: id } : { tvSeriesId: id },
          })
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
              path: { id: jobId, playlistId, itemId: item.id },
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
