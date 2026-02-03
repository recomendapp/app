'use client'

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { getValidatedQuery } from '../../_components/SearchResults';
import { upperFirst } from 'lodash';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchUsersOptions } from '@/api/client/options/searchOptions';
import { CardUser } from '@/components/Card/CardUser';

export const SearchUsers = () => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const searchQuery = getValidatedQuery(searchParams.get('q') || undefined);

  if (searchQuery && searchQuery.length > 0) {
    return <SearchResults search={searchQuery} />;
  }

  return <p className="text-muted-foreground">{upperFirst(t('common.messages.search_user'))}</p>
}

export const SearchResults = ({
  search,
} : {
  search: string;
}) => {
  const t = useTranslations()
  const { ref, inView } = useInView();
  const {
    data: users,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(useSearchUsersOptions({
    query: search,
  }));

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, users, fetchNextPage]);

  if (!isLoading && users?.pages[0]?.pagination.total_results === 0) {
    return (
      <p className='text-muted-foreground w-full'>
        {t.rich('common.messages.no_results_for', {
          query: search,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 xl:grid-cols-8 2xl:grid-cols-10 gap-4 overflow-x-auto overflow-y-hidden">
      {isLoading ? (
        Array.from({ length: 16 }).map((_, index) => (
          <Skeleton key={index} className="w-full aspect-square rounded-md" style={{ animationDelay: `${index * 0.12}s`}} />
        ))
      ) : users?.pages?.map((page, i) => (
          page.data.map((user, index) => (
            <CardUser
            key={i}
            ref={(i === users.pages.length - 1) && (index === page.data.length - 1) ? ref : undefined}
            user={user}
            variant='vertical'
            className='w-full'
            />
          )
        ))
      )}
    </div>
  );
}
