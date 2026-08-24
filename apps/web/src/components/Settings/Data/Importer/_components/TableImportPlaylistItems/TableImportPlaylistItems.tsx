'use client';
'use no memo';

import { useInfiniteQuery } from '@tanstack/react-query';
import { importPlaylistItemsInfiniteOptions } from '@libs/query-client';
import { ImporterTable } from '../ImporterTable/ImporterTable';
import { PlaylistItemColumns } from './_component/columns';

export function TableImportPlaylistItems({
  jobId,
  playlistId,
}: {
  jobId: number;
  playlistId: number;
}) {
  const query = useInfiniteQuery(importPlaylistItemsInfiniteOptions({ id: jobId, playlistId }));
  const columns = PlaylistItemColumns(jobId, playlistId);

  return (
    <ImporterTable
      query={query}
      columns={columns}
      isRowDimmed={(item) => item.matchStatus === 'skipped'}
    />
  );
}
