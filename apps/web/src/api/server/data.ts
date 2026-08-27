'use server';

import { getAnonApi } from '@/lib/api/server';
import { cache } from '@/lib/utils/cache';
import { importSourcesControllerListAll, exportSourcesControllerListAll } from '@libs/api-js';

const SOURCES_REVALIDATE_TIME = 60 * 60; // 1 hour

export const getImportSources = cache(
  async () => {
    const client = await getAnonApi();
    const { data, error } = await importSourcesControllerListAll({
      client,
    });
    if (error) throw error;
    if (data === undefined) throw new Error('No data');
    return data;
  },
  {
    revalidate: SOURCES_REVALIDATE_TIME,
  },
);

export const getExportSources = cache(
  async () => {
    const client = await getAnonApi();
    const { data, error } = await exportSourcesControllerListAll({
      client,
    });
    if (error) throw error;
    if (data === undefined) throw new Error('No data');
    return data;
  },
  {
    revalidate: SOURCES_REVALIDATE_TIME,
  },
);
