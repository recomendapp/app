'use client';
'use no memo';

import { useInfiniteQuery } from '@tanstack/react-query';
import { importBookmarksInfiniteOptions } from '@libs/query-client';
import { ImporterTable } from '../ImporterTable/ImporterTable';
import { BookmarkColumns } from './_component/columns';

export function TableImportBookmarks({ jobId }: { jobId: number }) {
  const query = useInfiniteQuery(importBookmarksInfiniteOptions({ id: jobId }));
  const columns = BookmarkColumns(jobId);

  return (
    <ImporterTable
      query={query}
      columns={columns}
      isRowDimmed={(item) => item.matchStatus === 'skipped'}
    />
  );
}
