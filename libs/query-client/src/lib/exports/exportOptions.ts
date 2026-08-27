import { queryOptions } from '@tanstack/react-query';
import { exportSourcesControllerListAll } from '@libs/api-js';
import { exportKeys } from './exportKeys';

export const exportSourcesListAllOptions = () => {
  return queryOptions({
    queryKey: exportKeys.sources(),
    queryFn: async () => {
      const { data, error } = await exportSourcesControllerListAll();
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};
