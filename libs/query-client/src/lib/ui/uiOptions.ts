import { queryOptions } from '@tanstack/react-query';
import { uiFeaturesControllerListAll } from '@libs/api-js';
import { uiKeys } from './uiKeys';

export const uiFeaturesOptions = () => {
  return queryOptions({
    queryKey: uiKeys.features(),
    queryFn: async () => {
      const { data, error } = await uiFeaturesControllerListAll();
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};
