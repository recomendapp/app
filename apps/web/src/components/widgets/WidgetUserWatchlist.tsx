'use client'

import { Link } from "@/lib/i18n/navigation";
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { upperFirst } from "lodash";
import { CardMovie } from "../Card/CardMovie";
import { MediaMovie, MediaTvSeries } from "@recomendapp/types";
import { CardTvSeries } from "../Card/CardTvSeries";
import { useUserWatchlistOptions } from "@/api/client/options/userOptions";
import { useQuery } from "@tanstack/react-query";

export const WidgetUserWatchlist = ({
  className,
} : React.HTMLAttributes<HTMLDivElement>) => {
  const { session } = useAuth();
  const t = useTranslations();

  const { data: watchlist } = useQuery(useUserWatchlistOptions({
    userId: session?.user.id,
    filters: {
      sortBy: 'created_at',
      sortOrder: 'random',
      limit: 6,
    }
  }));

  if (!session) return null;

  if (!watchlist || !watchlist.length) return (null);

  return (
  <div className={cn('@container/widget-user-watchlist space-y-2', className)}>
    <Button variant={'link'} className="p-0 w-fit font-semibold text-xl" asChild>
			<Link href={'/collection/watchlist'}>
        {upperFirst(t('common.messages.to_watch'))}
			</Link>
		</Button>
    <div className='grid grid-cols-2 @2xl/widget-user-watchlist:grid-cols-3 gap-4'>
      {watchlist.map((item, index) => (
        item.type === 'movie'
          ? <CardMovie key={index} movie={item.media as MediaMovie} />
          : <CardTvSeries key={index} tvSeries={item.media as MediaTvSeries} />
      ))}
    </div>
  </div>
  )
};
