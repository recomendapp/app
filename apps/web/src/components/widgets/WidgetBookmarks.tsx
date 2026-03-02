'use client'

import { Link } from "@/lib/i18n/navigation";
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { upperFirst } from "lodash";
import { CardMovie } from "../Card/CardMovie";
import { CardTvSeries } from "../Card/CardTvSeries";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userBookmarksInfiniteOptions } from "@libs/query-client";
import { MovieCompact, TvSeriesCompact } from "@packages/api-js";

const ITEM_LIMIT = 6;

interface WidgetBookmarksProps extends React.HTMLAttributes<HTMLDivElement> {
  limit?: number;
}

export const WidgetBookmarks = ({
  limit = ITEM_LIMIT,
  className,
} : WidgetBookmarksProps) => {
  const { user } = useAuth();
  const t = useTranslations();

  const { data: bookmarks } = useInfiniteQuery(userBookmarksInfiniteOptions({
    userId: user?.id,
    filters: {
      sort_by: 'random',
    }
  }));
  const flattendBookmarks = bookmarks?.pages.flatMap(page => page.data).slice(0, limit);

  if (!user) return null;

  if (!flattendBookmarks || !flattendBookmarks.length) return (null);

  return (
  <div className={cn('@container/widget-user-bookmarks space-y-2', className)}>
    <Button variant={'link'} className="p-0 w-fit font-semibold text-xl" asChild>
			<Link href={'/collection/bookmarks'}>
        {upperFirst(t('common.messages.to_watch'))}
			</Link>
		</Button>
    <div className='grid grid-cols-2 @2xl/widget-user-bookmarks:grid-cols-3 gap-4'>
      {flattendBookmarks?.map((item, index) => (
        item.type === 'movie'
          ? <CardMovie key={`bookmarks-${index}`} movie={item.media as MovieCompact} />
          : <CardTvSeries key={`bookmarks-${index}`} tvSeries={item.media as TvSeriesCompact} />
      ))}
    </div>
  </div>
  )
};
