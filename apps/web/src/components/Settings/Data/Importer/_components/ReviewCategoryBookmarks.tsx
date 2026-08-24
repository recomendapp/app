'use client';

import { TableImportBookmarks } from './TableImportBookmarks/TableImportBookmarks';

export function ReviewCategoryBookmarks({ jobId }: { jobId: number }) {
  return <TableImportBookmarks jobId={jobId} />;
}
