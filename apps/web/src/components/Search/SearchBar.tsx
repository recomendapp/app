'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useDebounce from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { Icons } from '@/config/icons';

interface SearchBarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const q = searchParams.get('q');
  const [searchQuery, setSearchQuery] = useState(q ?? '');

  const debouncedSearchTerm = useDebounce(searchQuery);

  useEffect(() => {
    if (!debouncedSearchTerm) {
      if (pathname.startsWith('/search')) {
        router.push(pathname);
      }
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set('q', searchQuery);
    if (!pathname.startsWith('/search')) {
      router.push(`/search?${params.toString()}`);
    } else {
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [debouncedSearchTerm]);

  return (
    <ButtonGroup className='w-full lg:max-w-lg'>
      <Input
      type="search"
      placeholder={t('pages.search.placeholder')}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className={cn("w-full", className)}
      autoFocus={pathname.startsWith('/search')}
      />
      <Button variant="outline" aria-label="Search">
        <Icons.search />
        <span className="sr-only">{upperFirst(t('common.messages.search'))}</span>
      </Button>
    </ButtonGroup>
  );
}
