import { QueryClient } from '@tanstack/react-query';
import {
  prependListItemToAllCaches,
  prependToInfiniteCache,
  prependToPaginatedCache,
  removeFromFlatCache,
  removeFromInfiniteCache,
  removeFromPaginatedCache,
  removeListItemFromAllCaches,
  resolveUpdater,
  updateFromFlatCache,
  updateFromInfiniteCache,
  updateFromPaginatedCache,
  updateListItemInAllCaches,
  updateOrRemoveListItemInAllCaches,
} from './utils';

type Item = { id: number; name: string };

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe('resolveUpdater', () => {
  it('returns the updater directly when it is a plain object', () => {
    expect(resolveUpdater({ id: 1, name: 'a' }, { name: 'b' })).toEqual({ name: 'b' });
  });

  it('invokes the updater function with the item when it is a function', () => {
    const item = { id: 1, name: 'a' };
    const result = resolveUpdater(item, (i) => ({ name: `${i.name}!` }));
    expect(result).toEqual({ name: 'a!' });
  });
});

describe('updateFromFlatCache', () => {
  it('updates the matching item (by explicit primitive matcher) in an array query', () => {
    const client = createClient();
    const key = ['items', 'all'];
    client.setQueryData<Item[]>(key, [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);

    updateFromFlatCache<Item>(client, key, { name: 'B' }, 2);

    expect(client.getQueryData<Item[]>(key)).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'B' },
    ]);
  });

  it('updates the matching item via a matcher function', () => {
    const client = createClient();
    const key = ['items', 'all'];
    client.setQueryData<Item[]>(key, [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);

    updateFromFlatCache<Item>(client, key, { name: 'B' }, (item) => item.name === 'b');

    expect(client.getQueryData<Item[]>(key)).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'B' },
    ]);
  });

  it('falls back to matching by updater.id when no matcher is given and the updater is a plain object', () => {
    const client = createClient();
    const key = ['items', 'all'];
    client.setQueryData<Item[]>(key, [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);

    updateFromFlatCache<Item>(client, key, { id: 2, name: 'B' } as any);

    expect(client.getQueryData<Item[]>(key)).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'B' },
    ]);
  });

  it('is a no-op when the updater is a function and no matcher is given (documented limitation)', () => {
    // 'id' in {} is always false for a function updater with no explicit
    // matcher, so nothing ever matches. Every current call site passes an
    // explicit matcher, so this never fires in practice — documenting it so
    // it stays a known, visible limitation rather than a silent trap.
    const client = createClient();
    const key = ['items', 'all'];
    const original = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ];
    client.setQueryData<Item[]>(key, original);

    updateFromFlatCache<Item>(client, key, (item) => ({ name: `${item.name}!` }));

    expect(client.getQueryData<Item[]>(key)).toEqual(original);
  });

  it('leaves an unset query untouched', () => {
    const client = createClient();
    const key = ['items', 'all'];

    expect(() => updateFromFlatCache<Item>(client, key, { name: 'B' }, 2)).not.toThrow();
    expect(client.getQueryData<Item[]>(key)).toBeUndefined();
  });
});

describe('removeFromFlatCache', () => {
  it('removes the matching item by primitive matcher', () => {
    const client = createClient();
    const key = ['items', 'all'];
    client.setQueryData<Item[]>(key, [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);

    removeFromFlatCache<Item>(client, key, 1);

    expect(client.getQueryData<Item[]>(key)).toEqual([{ id: 2, name: 'b' }]);
  });

  it('removes the matching item by matcher function', () => {
    const client = createClient();
    const key = ['items', 'all'];
    client.setQueryData<Item[]>(key, [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);

    removeFromFlatCache<Item>(client, key, (item) => item.name === 'a');

    expect(client.getQueryData<Item[]>(key)).toEqual([{ id: 2, name: 'b' }]);
  });
});

describe('updateFromPaginatedCache', () => {
  const meta = { total_results: 2, total_pages: 1, current_page: 1, per_page: 10 };

  it('returns undefined unchanged when there is no data', () => {
    expect(updateFromPaginatedCache<Item, any>(undefined, { name: 'B' }, 1)).toBeUndefined();
  });

  it('updates the matching item and leaves the rest untouched', () => {
    const oldData = {
      data: [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ],
      meta,
    };

    const result = updateFromPaginatedCache<Item, any>(oldData, { name: 'B' }, 2);

    expect(result?.data).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'B' },
    ]);
  });
});

describe('removeFromPaginatedCache', () => {
  const perPage = 2;

  function seedTwoPages(client: QueryClient, page1Key: unknown[], page2Key: unknown[]) {
    client.setQueryData(page1Key, {
      data: [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ],
      meta: { total_results: 3, total_pages: 2, current_page: 1, per_page: perPage },
    });
    client.setQueryData(page2Key, {
      data: [{ id: 3, name: 'c' }],
      meta: { total_results: 3, total_pages: 2, current_page: 2, per_page: perPage },
    });
  }

  it('removes the item, re-slices remaining items across pages, and recomputes meta', () => {
    const client = createClient();
    const page1Key = ['items', 'paginated', 1];
    const page2Key = ['items', 'paginated', 2];
    seedTwoPages(client, page1Key, page2Key);

    removeFromPaginatedCache<Item, any>(client, ['items', 'paginated'], 2);

    expect(client.getQueryData(page1Key)).toEqual({
      data: [
        { id: 1, name: 'a' },
        { id: 3, name: 'c' },
      ],
      meta: { total_results: 2, total_pages: 1, current_page: 1, per_page: perPage },
    });
    expect(client.getQueryData(page2Key)).toEqual({
      data: [],
      meta: { total_results: 2, total_pages: 1, current_page: 2, per_page: perPage },
    });
  });

  it('invalidates the last affected query key after removing', () => {
    const client = createClient();
    const page1Key = ['items', 'paginated', 1];
    const page2Key = ['items', 'paginated', 2];
    seedTwoPages(client, page1Key, page2Key);
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    removeFromPaginatedCache<Item, any>(client, ['items', 'paginated'], 2);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: page2Key });
  });

  it('leaves every page untouched when the matcher matches nothing', () => {
    const client = createClient();
    const page1Key = ['items', 'paginated', 1];
    const page2Key = ['items', 'paginated', 2];
    seedTwoPages(client, page1Key, page2Key);
    const before1 = client.getQueryData(page1Key);
    const before2 = client.getQueryData(page2Key);

    removeFromPaginatedCache<Item, any>(client, ['items', 'paginated'], 999);

    expect(client.getQueryData(page1Key)).toEqual(before1);
    expect(client.getQueryData(page2Key)).toEqual(before2);
  });
});

describe('updateFromInfiniteCache', () => {
  it('updates the matching item within its page', () => {
    const oldData = {
      pages: [
        {
          data: [
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
          ],
          meta: { per_page: 10, total_results: 2 },
        },
      ],
      pageParams: [null],
    };

    const result = updateFromInfiniteCache<Item, any>(oldData, { name: 'B' }, 2);

    expect(result?.pages[0].data).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'B' },
    ]);
  });
});

describe('removeFromInfiniteCache', () => {
  function twoPages() {
    return {
      pages: [
        { data: [{ id: 1, name: 'a' }], meta: { per_page: 10, total_results: 2 } },
        { data: [{ id: 2, name: 'b' }], meta: { per_page: 10 } },
      ],
      pageParams: [null, 'cursor-2'],
    };
  }

  it('removes the item from whichever page contains it', () => {
    const result = removeFromInfiniteCache<Item, any>(twoPages(), 2);
    expect(result?.pages[0].data).toEqual([{ id: 1, name: 'a' }]);
    expect(result?.pages[1].data).toEqual([]);
  });

  it('decrements the first page total_results when an item is removed from a later page', () => {
    const result = removeFromInfiniteCache<Item, any>(twoPages(), 2);
    expect(result?.pages[0].meta.total_results).toBe(1);
  });

  it('does not decrement total_results when the matcher matches nothing (regression)', () => {
    // Previously this always decremented page[0].total_results even when no
    // item anywhere matched, which drifted the displayed count down over
    // time for every infinite-cache instance a removal filter touched.
    const result = removeFromInfiniteCache<Item, any>(twoPages(), 999);
    expect(result?.pages[0].meta.total_results).toBe(2);
    expect(result?.pages[0].data).toEqual([{ id: 1, name: 'a' }]);
    expect(result?.pages[1].data).toEqual([{ id: 2, name: 'b' }]);
  });

  it('never decrements total_results below 0', () => {
    const oldData = {
      pages: [{ data: [{ id: 1, name: 'a' }], meta: { per_page: 10, total_results: 0 } }],
      pageParams: [null],
    };
    const result = removeFromInfiniteCache<Item, any>(oldData, 1);
    expect(result?.pages[0].meta.total_results).toBe(0);
  });
});

describe('prependToPaginatedCache', () => {
  it('prepends the item and recomputes total_results/total_pages', () => {
    const oldData = {
      data: [{ id: 1, name: 'a' }],
      meta: { total_results: 1, total_pages: 1, current_page: 1, per_page: 10 },
    };

    const result = prependToPaginatedCache<Item, any>(oldData, { id: 2, name: 'b' });

    expect(result?.data).toEqual([
      { id: 2, name: 'b' },
      { id: 1, name: 'a' },
    ]);
    expect(result?.meta.total_results).toBe(2);
    expect(result?.meta.total_pages).toBe(1);
  });

  it('returns undefined unchanged when there is no data', () => {
    expect(prependToPaginatedCache<Item, any>(undefined, { id: 1, name: 'a' })).toBeUndefined();
  });
});

describe('prependToInfiniteCache', () => {
  it('prepends the item to the first page only and bumps its total_results', () => {
    const oldData = {
      pages: [
        { data: [{ id: 1, name: 'a' }], meta: { per_page: 10, total_results: 1 } },
        { data: [{ id: 2, name: 'b' }], meta: { per_page: 10 } },
      ],
      pageParams: [null, 'cursor-2'],
    };

    const result = prependToInfiniteCache<Item, any>(oldData, { id: 3, name: 'c' });

    expect(result?.pages[0].data).toEqual([
      { id: 3, name: 'c' },
      { id: 1, name: 'a' },
    ]);
    expect(result?.pages[0].meta.total_results).toBe(2);
    expect(result?.pages[1].data).toEqual([{ id: 2, name: 'b' }]);
  });

  it('returns oldData unchanged when there are no pages', () => {
    const oldData = { pages: [], pageParams: [] };
    expect(prependToInfiniteCache<Item, any>(oldData, { id: 1, name: 'a' })).toBe(oldData);
  });
});

describe('prependListItemToAllCaches', () => {
  it('prepends to both the paginated and infinite caches matching their filters', () => {
    const client = createClient();
    const paginatedKey = ['items', 'paginated'];
    const infiniteKey = ['items', 'infinite'];
    client.setQueryData(paginatedKey, {
      data: [{ id: 1, name: 'a' }],
      meta: { total_results: 1, total_pages: 1, current_page: 1, per_page: 10 },
    });
    client.setQueryData(infiniteKey, {
      pages: [{ data: [{ id: 1, name: 'a' }], meta: { per_page: 10, total_results: 1 } }],
      pageParams: [null],
    });

    prependListItemToAllCaches(
      client,
      { paginated: paginatedKey, infinite: infiniteKey },
      { id: 2, name: 'b' },
    );

    expect((client.getQueryData(paginatedKey) as any).data[0]).toEqual({ id: 2, name: 'b' });
    expect((client.getQueryData(infiniteKey) as any).pages[0].data[0]).toEqual({
      id: 2,
      name: 'b',
    });
  });
});

describe('updateListItemInAllCaches / removeListItemFromAllCaches', () => {
  it('updates the item across flat, paginated and infinite caches in one call', () => {
    const client = createClient();
    const allKey = ['items', 'all'];
    const paginatedKey = ['items', 'paginated'];
    const infiniteKey = ['items', 'infinite'];
    client.setQueryData<Item[]>(allKey, [{ id: 1, name: 'a' }]);
    client.setQueryData(paginatedKey, {
      data: [{ id: 1, name: 'a' }],
      meta: { total_results: 1, total_pages: 1, current_page: 1, per_page: 10 },
    });
    client.setQueryData(infiniteKey, {
      pages: [{ data: [{ id: 1, name: 'a' }], meta: { per_page: 10, total_results: 1 } }],
      pageParams: [null],
    });

    updateListItemInAllCaches(
      client,
      { all: allKey, paginated: paginatedKey, infinite: infiniteKey },
      { name: 'A!' },
      1,
    );

    expect(client.getQueryData<Item[]>(allKey)).toEqual([{ id: 1, name: 'A!' }]);
    expect((client.getQueryData(paginatedKey) as any).data[0].name).toBe('A!');
    expect((client.getQueryData(infiniteKey) as any).pages[0].data[0].name).toBe('A!');
  });

  it('removes the item across flat and infinite caches in one call', () => {
    const client = createClient();
    const allKey = ['items', 'all'];
    const infiniteKey = ['items', 'infinite'];
    client.setQueryData<Item[]>(allKey, [{ id: 1, name: 'a' }]);
    client.setQueryData(infiniteKey, {
      pages: [{ data: [{ id: 1, name: 'a' }], meta: { per_page: 10, total_results: 1 } }],
      pageParams: [null],
    });

    removeListItemFromAllCaches(client, { all: allKey, infinite: infiniteKey }, 1);

    expect(client.getQueryData<Item[]>(allKey)).toEqual([]);
    expect((client.getQueryData(infiniteKey) as any).pages[0].data).toEqual([]);
  });
});

describe('updateOrRemoveListItemInAllCaches', () => {
  it('updates the item when the modifier returns a partial', () => {
    const client = createClient();
    const allKey = ['items', 'all'];
    client.setQueryData<Item[]>(allKey, [{ id: 1, name: 'a' }]);

    updateOrRemoveListItemInAllCaches<Item, any, any>(
      client,
      { all: allKey },
      (item) => item.id === 1,
      () => ({ name: 'A!' }),
    );

    expect(client.getQueryData<Item[]>(allKey)).toEqual([{ id: 1, name: 'A!' }]);
  });

  it('removes the item when the modifier returns null', () => {
    const client = createClient();
    const allKey = ['items', 'all'];
    client.setQueryData<Item[]>(allKey, [{ id: 1, name: 'a' }]);

    updateOrRemoveListItemInAllCaches<Item, any, any>(
      client,
      { all: allKey },
      (item) => item.id === 1,
      () => null,
    );

    expect(client.getQueryData<Item[]>(allKey)).toEqual([]);
  });

  it('does nothing when the item cannot be found in any of the given caches', () => {
    const client = createClient();
    const allKey = ['items', 'all'];
    const original = [{ id: 1, name: 'a' }];
    client.setQueryData<Item[]>(allKey, original);
    const modifier = jest.fn();

    updateOrRemoveListItemInAllCaches<Item, any, any>(
      client,
      { all: allKey },
      (item) => item.id === 999,
      modifier,
    );

    expect(modifier).not.toHaveBeenCalled();
    expect(client.getQueryData<Item[]>(allKey)).toEqual(original);
  });
});
