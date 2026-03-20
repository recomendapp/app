'use client'

import { Link } from "@/lib/i18n/navigation";
import { useAuth } from '@/context/auth-context';
import { UserAvatar } from '@/components/User/UserAvatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { upperFirst } from "lodash";
import { CardMovie } from "../Card/CardMovie";
import { CardTvSeries } from "../Card/CardTvSeries";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { userRecosInfiniteOptions } from "@libs/query-client";
import { MovieCompact, TvSeriesCompact } from "@packages/api-js/src";
import { AvatarGroup, AvatarGroupCount } from "../ui/avatar";
import { TextIcon } from "lucide-react";

const ITEM_LIMIT = 6;

interface WidgetRecosProps extends React.HTMLAttributes<HTMLDivElement> {
  limit?: number;
}

export const WidgetRecos = ({
  limit = ITEM_LIMIT,
  className,
} : WidgetRecosProps) => {
  const { user } = useAuth();
  const t = useTranslations('common');

  const { data: recos } = useInfiniteQuery(userRecosInfiniteOptions({
    userId: user?.id,
    filters: {
      sort_by: 'random',
    }
  }));
  const flattendRecos = recos?.pages.flatMap(page => page.data).slice(0, limit)

  const sendersShow = 3;

  if (!user) return null;

  if (!flattendRecos || !flattendRecos.length) return null;

  return (
  <div className={cn('@container/widget-user-recos space-y-2', className)}>
    <Button variant={'link'} className="p-0 w-fit font-semibold text-xl" asChild>
			<Link href={'/collection/my-recos'}>
        {upperFirst(t('messages.reco_by_your_friends'))}
			</Link>
		</Button>
    <div className='grid grid-cols-2 @2xl/widget-user-recos:grid-cols-3 gap-4'>
      {flattendRecos.map((item, index) => (
        <Wrapper key={index} {...(item.type === 'movie' ? { type: 'movie', media: item.media } : { type: 'tv_series', media: item.media })}>
          <AvatarGroup>
            {item.senders?.slice(0, sendersShow).reverse().map((item, i) => (
              <div key={i} className='relative'>
                <UserAvatar avatarUrl={item.user.avatar} username={item.user.username} className="w-5 h-5" />
                {item?.comment ? <TextIcon size={15} className='absolute -top-1 -right-1 rounded-full bg-background text-accent-yellow p-1'/> : null}
              </div>
            ))}
            {item.senders.length > sendersShow && (
              <AvatarGroupCount>+{item.senders.length - sendersShow}</AvatarGroupCount>
            )}
          </AvatarGroup>
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
  | { type: 'movie'; media: MovieCompact }
  | { type: 'tv_series'; media: TvSeriesCompact }
)>) => {
  switch (type) {
    case 'tv_series':
      return <CardTvSeries tvSeries={media}>{children}</CardTvSeries>;
    default:
    case 'movie':
      return <CardMovie movie={media}>{children}</CardMovie>;
  }
};