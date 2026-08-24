'use client';
'use no memo';

import { useInfiniteQuery } from '@tanstack/react-query';
import { importLogTvSeriesInfiniteOptions } from '@libs/query-client';
import { ImporterTable } from '../ImporterTable/ImporterTable';
import { LogTvSeriesColumns } from './_component/columns';

export function TableImportLogTvSeries({ jobId }: { jobId: number }) {
  const query = useInfiniteQuery(importLogTvSeriesInfiniteOptions({ id: jobId }));
  const columns = LogTvSeriesColumns(jobId);

  return (
    <ImporterTable
      query={query}
      columns={columns}
      isRowDimmed={(item) => item.matchStatus === 'skipped'}
    />
  );
}
