'use client'

import { Link } from "@/lib/i18n/navigation";
import { useAuth } from '@/context/auth-context';
import { UserAvatar } from '@/components/User/UserAvatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { upperFirst } from "lodash";
import { MediaMovie, MediaTvSeries } from "@recomendapp/types";
import { CardMovie } from "../Card/CardMovie";
import { CardTvSeries } from "../Card/CardTvSeries";
import { useQuery } from "@tanstack/react-query";
import { useUserRecosOptions } from "@/api/client/options/userOptions";
import { PropsWithChildren } from "react";

export const WidgetUserRecos = ({
  className,
} : React.HTMLAttributes<HTMLDivElement>) => {
  const { session } = useAuth();
  const t = useTranslations('common');

  const { data: recos } = useQuery(useUserRecosOptions({
    userId: session?.user.id,
    filters: {
      sortBy: 'created_at',
      sortOrder: 'random',
      limit: 6,
    }
  }));

  const sendersShow = 3;

  if (!session) return null;

  if (!recos || !recos.length) return null;

  return (
  <div className={cn('@container/widget-user-recos space-y-2', className)}>
    <Button variant={'link'} className="p-0 w-fit font-semibold text-xl" asChild>
			<Link href={'/collection/my-recos'}>
        {upperFirst(t('messages.reco_by_your_friends'))}
			</Link>
		</Button>
    <div className='grid grid-cols-2 @2xl/widget-user-recos:grid-cols-3 gap-4'>
      {recos.map((item, index) => (
        <Wrapper key={index} {...(item.type === 'movie' ? { type: 'movie', media: item.media } : { type: 'tv_series', media: item.media })}>
          <div className="flex -space-x-2 overflow-hidden">
            {item.senders?.slice(0, sendersShow).map(({user}:any, index) => (
            <UserAvatar
              key={index}
              avatarUrl={user?.avatar_url ?? ''}
              username={user?.username ?? ''}
              className='w-4 h-4'
            />
            ))}
            {item.senders?.length! > sendersShow ? (
              <div className='h-4 w-4 flex items-center justify-center bg-black/60 rounded-full border text-xs text-muted-foreground'>
                +{item.senders?.length! - sendersShow}
              </div>
            ) : null}
          </div>
        </Wrapper>
      ))}
    </div>
  </div>
  )
};

const Wrapper = ({
  type,
  media,
  children,
} : PropsWithChildren<(
  | { type: 'movie'; media: MediaMovie }
  | { type: 'tv_series'; media: MediaTvSeries }
)>) => {
  switch (type) {
    case 'tv_series':
      return <CardTvSeries tvSeries={media}>{children}</CardTvSeries>;
    default:
    case 'movie':
      return <CardMovie movie={media}>{children}</CardMovie>;
  }
};