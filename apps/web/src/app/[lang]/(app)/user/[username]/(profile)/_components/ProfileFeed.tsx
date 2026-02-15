'use client'

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useUserFeedInfiniteOptions } from '@/api/client/options/userOptions';
import { Spinner } from '@/components/ui/spinner';
import { CardFeedActivityMovie } from '@/components/Card/feed/CardFeedActivityMovie';
import { CardFeedActivityTvSeries } from '@/components/Card/feed/CardFeedActivityTvSeries';
import { CardFeedPlaylistLike } from '@/components/Card/feed/CardFeedPlaylistLike';
import { CardFeedReviewMovieLike } from '@/components/Card/feed/CardFeedReviewMovieLike';
import { CardFeedReviewTvSeriesLike } from '@/components/Card/feed/CardFeedReviewTvSeriesLike';

export const ProfileFeed = ({
  profileId,
}: {
  profileId: string;
}) => {
  const t = useTranslations();
  const { ref, inView } = useInView();

  const {
    data: feed,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery(useUserFeedInfiniteOptions({
    userId: profileId,
  }));

  useEffect(() => {
    if (inView && hasNextPage)
      fetchNextPage();
    }, [inView, hasNextPage, feed, fetchNextPage]);

  return (
  <div className='w-full flex flex-col items-center'>
    <div className="w-full max-w-2xl">
      {isLoading || feed == undefined ? (
        <div className="flex justify-center h-full">
          <Spinner />
        </div>
      ) : !isLoading && feed?.pages[0]?.length ? (
        <div className="flex flex-col gap-4">
          {feed.pages.map((page, i) => (
            page?.map((activity, index) => {
              const scrollRef = (i === feed.pages.length - 1) && (index === page.length - 1) ? ref : undefined;
              return (
                activity.activity_type === 'activity_movie' ? (
                  <CardFeedActivityMovie ref={scrollRef} key={index} author={activity.author} activity={activity.content} />
                ) : activity.activity_type === 'activity_tv_series' ? (
                  <CardFeedActivityTvSeries ref={scrollRef} key={index} author={activity.author} activity={activity.content} />
                ) : activity.activity_type === 'playlist_like' ? (
                  <CardFeedPlaylistLike ref={scrollRef} key={index} author={activity.author} playlistLike={activity.content} />
                ) : activity.activity_type === 'review_movie_like' ? (
                  <CardFeedReviewMovieLike ref={scrollRef} key={index} author={activity.author} reviewLike={activity.content} />
                ) : activity.activity_type === 'review_tv_series_like' ? (
                  <CardFeedReviewTvSeriesLike ref={scrollRef} key={index} author={activity.author} reviewLike={activity.content} />
                ) : null
              )
            })
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
        {upperFirst(t('common.messages.is_empty'))}
        </div>
      )}
    </div>
  </div>
  );
}
