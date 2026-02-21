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
import { userBookmarksInfiniteOptions } from "@libs/query-client/src";
import { MovieCompact, TvSeriesCompact } from "@packages/api-js";

const ITEM_LIMIT = 6;

export const WidgetUserWatchlist = ({
  className,
} : React.HTMLAttributes<HTMLDivElement>) => {
  const { user } = useAuth();
  const t = useTranslations();

  const { data: watchlist } = useInfiniteQuery(userBookmarksInfiniteOptions({
    userId: user?.id,
    filters: {
      sort_by: 'random',
    }
  }));
  const watchlistItems = watchlist?.pages.flatMap(page => page.data).slice(0, ITEM_LIMIT);

  if (!user) return null;

  if (!watchlist || !watchlist.pages[0].data.length) return (null);

  return (
  <div className={cn('@container/widget-user-watchlist space-y-2', className)}>
    <Button variant={'link'} className="p-0 w-fit font-semibold text-xl" asChild>
			<Link href={'/collection/bookmarks'}>
        {upperFirst(t('common.messages.to_watch'))}
			</Link>
		</Button>
    <div className='grid grid-cols-2 @2xl/widget-user-watchlist:grid-cols-3 gap-4'>
      {watchlistItems?.map((item, index) => (
        item.type === 'movie'
          ? <CardMovie key={`watchlist-${index}`} movie={item.media as MovieCompact} />
          : <CardTvSeries key={`watchlist-${index}`} tvSeries={item.media as TvSeriesCompact} />
      ))}
    </div>
  </div>
  )
};
