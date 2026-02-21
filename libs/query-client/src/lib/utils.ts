import { CursorPaginationMeta, PaginationMeta } from '@packages/api-js';
import { InfiniteData, QueryClient, QueryFilters, QueryKey } from '@tanstack/react-query';

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Utility function to update an item in a paginated query cache.
 * @param oldData The existing paginated query data.
 * @param updatedItem The item with updated data to be merged into the cache.
 * @returns Updated paginated query data with the item updated.
 */
export const updateFromPaginatedCache = <
  TItem extends { id: string | number },
  TUpdated extends { id: TItem['id'] },
  TPage extends PaginatedResponse<TItem>
>(
  oldData: InfiniteData<TPage> | undefined,
  updatedItem: TUpdated
): InfiniteData<TPage> | undefined => {
  if (!oldData || !oldData.pages.length) return oldData;

  const newPages = oldData.pages.map((page) => ({
    ...page,
    data: page.data.map((item) =>
      item.id === updatedItem.id ? { ...item, ...updatedItem } : item
    ),
  }));

  return {
    ...oldData,
    pages: newPages,
  };
};

/**
 * Utility function to remove an item from standard paginated queries cache and shift items across pages.
 * @param queryClient The React Query client instance.
 * @param queryKeyFilter The base query key to match all pages (e.g., ['movies', movieId]).
 * @param itemIdToDelete The ID of the item to remove.
 */
export const removeFromPaginatedCache = <
  TItem extends { id: string | number },
  TPage extends PaginatedResponse<TItem>
>(
  queryClient: QueryClient,
  filters: QueryKey | QueryFilters,
  matcher: string | number | ((item: TItem) => boolean)
): void => {
  const queryFilters: QueryFilters = Array.isArray(filters) 
    ? { queryKey: filters } 
    : (filters as QueryFilters);

  const matchedQueries = queryClient.getQueriesData<TPage>(queryFilters);

  if (!matchedQueries.length) return;

  const groupedQueries = matchedQueries.reduce((acc, query) => {
    const [queryKey, data] = query;
    if (!data) return acc;
    
    const baseKeyString = JSON.stringify(queryKey.slice(0, -1));
    if (!acc[baseKeyString]) acc[baseKeyString] = [];
    acc[baseKeyString].push(query);
    return acc;
  }, {} as Record<string, typeof matchedQueries>);

  Object.values(groupedQueries).forEach((group) => {
    const validQueries = group.sort(
      ([, dataA], [, dataB]) => dataA!.meta.current_page - dataB!.meta.current_page
    );

    let itemFound = false;
    const allItems = validQueries.flatMap(([, data]) => data!.data);
    
    const filteredItems = allItems.filter((item) => {
      const isMatch = typeof matcher === 'function' 
        ? matcher(item) 
        : item.id === matcher;

      if (isMatch) {
        itemFound = true;
        return false;
      }
      return true;
    });

    if (!itemFound) return; 

    const perPage = validQueries[0][1]!.meta.per_page;
    let lastAffectedQueryKey: QueryKey | null = null;

    validQueries.forEach(([queryKey, originalPage], index) => {
      const pageItems = filteredItems.slice(index * perPage, (index + 1) * perPage);
      
      const newTotalResults = Math.max(0, originalPage!.meta.total_results - 1);
      const newTotalPages = Math.ceil(newTotalResults / perPage);

      const newPage: TPage = {
        ...originalPage!,
        data: pageItems,
        meta: {
          ...originalPage!.meta,
          total_results: newTotalResults,
          total_pages: newTotalPages,
        },
      };

      queryClient.setQueryData(queryKey, newPage);
      lastAffectedQueryKey = queryKey;
    });

    if (lastAffectedQueryKey) {
      queryClient.invalidateQueries({ queryKey: lastAffectedQueryKey });
    }
  });
};

export interface InfinitePaginatedResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
}

/**
 * Utility function to update an item in a cursor-based paginated query cache.
 * @param oldData The existing cursor-paginated query data.
 * @param updatedItem The item with updated data to be merged into the cache.
 * @returns Updated cursor-paginated query data with the item updated.
 */
export const updateFromInfiniteCache = <
  TItem extends { id: string | number },
  TUpdated extends { id: TItem['id'] },
  TPage extends InfinitePaginatedResponse<TItem>
>(
  oldData: InfiniteData<TPage> | undefined,
  updatedItem: TUpdated,
  matcher?: string | number | ((item: TItem) => boolean)
): InfiniteData<TPage> | undefined => {
  if (!oldData) return oldData;

  return {
	...oldData,
	pages: oldData.pages.map((page) => ({
		...page,
		data: page.data.map((item) => {
      const isMatch = typeof matcher === 'function' 
        ? matcher(item) 
        : matcher === undefined 
          ? item.id === updatedItem.id
        : item.id === matcher;
      return isMatch ? { ...item, ...updatedItem } : item;
		}),
	})),
  };
};

/**
 * Utility function to remove an item from a cursor-based paginated query cache.
 * @param oldData The existing cursor-paginated query data.
 * @param matcher The ID of the item to remove from the cache, or a function that returns true for items to be removed.
 * @returns Updated cursor-paginated query data with the item removed.
 */
export const removeFromInfiniteCache = <
  TItem extends { id: string | number },
  TPage extends InfinitePaginatedResponse<TItem>
>(
  oldData: InfiniteData<TPage> | undefined,
  matcher: string | number | ((item: TItem) => boolean)
): InfiniteData<TPage> | undefined => {
  if (!oldData) return oldData;

  return {
    ...oldData,
    pages: oldData.pages.map((page) => ({
      ...page,
      data: page.data.filter((item) => {
        const isMatch = typeof matcher === 'function' 
          ? matcher(item) 
          : item.id === matcher;
        return !isMatch;
      }),
    })),
  };
};