import { useEffect } from 'react';
import { realtime } from '@libs/api-js';
import { useImportCacheUpdate } from '../imports';

export function useRealtimeSyncImports(enabled: boolean) {
  const { setJob, invalidateImportedCollections } = useImportCacheUpdate();

  useEffect(() => {
    if (!enabled) return;

    return realtime.onImportEvents({
      onImportProgress: (job) => setJob(job),
      onImportStaged: (job) => setJob(job),
      onImportValidated: (job) => {
        setJob(job);
        invalidateImportedCollections(job.userId);
      },
      onImportFailed: (job) => setJob(job),
    });
  }, [enabled, setJob, invalidateImportedCollections]);
}
