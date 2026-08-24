'use client';

import { TableImportLogMovies } from './TableImportLogMovies/TableImportLogMovies';

export function ReviewCategoryLogMovies({ jobId }: { jobId: number }) {
  return <TableImportLogMovies jobId={jobId} />;
}
