'use client';

import { TableImportLogTvSeries } from './TableImportLogTvSeries/TableImportLogTvSeries';

export function ReviewCategoryLogTvSeries({ jobId }: { jobId: number }) {
  return <TableImportLogTvSeries jobId={jobId} />;
}
