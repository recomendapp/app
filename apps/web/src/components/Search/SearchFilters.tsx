'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { usePathname, useRouter } from '@/lib/i18n/navigation';

export default function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');
  const [searchFilter, setSearchFilter] = useState<string | undefined>(
    getInitialFilter()
  );

  function selectSearchFilter(filter: string) {
    const segments = pathname.split('/');
    segments[2] = filter;
    const updatedPathname = segments.join('/');
    const queryParams = new URLSearchParams();
    if (searchQuery) {
      queryParams.set('q', searchQuery);
    }
    const queryString = queryParams.toString();
    const url = queryString
      ? `${updatedPathname}?${queryString}`
      : updatedPathname;

    router.push(url);
  }

  function getInitialFilter() {
    const segments = pathname.split('/');
    if (segments.length > 2) {
      const filter = segments[2];
      if (['films', 'playlists', 'users', 'crew-cast'].includes(filter)) {
        return filter;
      }
    }
    return undefined;
  }

  useEffect(() => {
    setSearchFilter(getInitialFilter());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!searchQuery) return null;

  return (
    <ScrollArea>
      <div className="flex gap-4 pb-2">
        <Button
          variant={!searchFilter ? 'default' : 'outline'}
          className={`rounded-md shrink-0`}
          onClick={() => selectSearchFilter('')}
        >
          Tout
        </Button>
        <Button
          variant={searchFilter == 'films' ? 'default' : 'outline'}
          className={`rounded-md shrink-0`}
          onClick={() => selectSearchFilter('films')}
        >
          Films
        </Button>
        <Button
          variant={searchFilter == 'playlists' ? 'default' : 'outline'}
          className={`rounded-md shrink-0`}
          onClick={() => selectSearchFilter('playlists')}
        >
          Playlists
        </Button>
        <Button
          variant={searchFilter == 'users' ? 'default' : 'outline'}
          className={`rounded-md shrink-0`}
          onClick={() => selectSearchFilter('users')}
        >
          Utilisateurs
        </Button>
        <Button
          variant={searchFilter == 'crew-cast' ? 'default' : 'outline'}
          className={`rounded-md shrink-0`}
          onClick={() => selectSearchFilter('crew-cast')}
        >
          Crew & Cast
        </Button>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
