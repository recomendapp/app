'use client';
'use no memo';

import { useInfiniteQuery } from '@tanstack/react-query';
import { importLogMoviesInfiniteOptions } from '@libs/query-client';
import { ImporterTable } from '../ImporterTable/ImporterTable';
import { LogMovieColumns } from './_component/columns';

export function TableImportLogMovies({ jobId }: { jobId: number }) {
  const query = useInfiniteQuery(importLogMoviesInfiniteOptions({ id: jobId }));
  const columns = LogMovieColumns(jobId);

  return (
    <ImporterTable
      query={query}
      columns={columns}
      isRowDimmed={(item) => item.matchStatus === 'skipped'}
    />
  );
}
