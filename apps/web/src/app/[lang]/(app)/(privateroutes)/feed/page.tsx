'use client'

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import Loader from "@/components/Loader";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { CardFeedLogMovie } from "@/components/Card/feed/CardFeedLogMovie";
import { CardFeedLogTvSeries } from "@/components/Card/feed/CardFeedLogTvSeries";
import { CardFeedPlaylistLike } from "@/components/Card/feed/CardFeedPlaylistLike";
import { CardFeedReviewMovieLike } from "@/components/Card/feed/CardFeedReviewMovieLike";
import { CardFeedReviewTvSeriesLike } from "@/components/Card/feed/CardFeedReviewTvSeriesLike";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userFeedInfiniteOptions } from "@libs/query-client";
import { useAuth } from "@/context/auth-context";
import { Icons } from "@/config/icons";

export default function Feed() {
  const t = useTranslations();
  const { user } = useAuth();

  const { ref, inView } = useInView();

  const {
    data: feed,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(userFeedInfiniteOptions({
    userId: user?.id
  }));

  useEffect(() => {
    if (inView && hasNextPage)
      fetchNextPage();
   }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="w-full max-w-2xl">
      {isLoading || feed == undefined ? (
        <div className="flex items-center h-full">
          <Loader />
        </div>
      ) : !isLoading && feed?.pages[0]?.data ? (
        <div className="flex flex-col gap-4">
          {feed.pages.map((page, i) => (
            page?.data.map((item, index) => (
              item.activityType === 'log_movie' ? (
                <CardFeedLogMovie key={index} data={item} />
              ) : item.activityType === 'log_tv_series' ? (
                <CardFeedLogTvSeries key={index} data={item} />
              ) : item.activityType === 'playlist_like' ? (
                <CardFeedPlaylistLike key={index} data={item} />
              ) : item.activityType === 'review_movie_like' ? (
                <CardFeedReviewMovieLike key={index} data={item} />
              ) : item.activityType === 'review_tv_series_like' ? (
                <CardFeedReviewTvSeriesLike key={index} data={item} />
              ) : null
            ))
          ))}
          {isFetching ? (
            <div className="flex items-center justify-center p-4">
              <Icons.loader />
            </div>
          ): (
            <div ref={ref} />
          )}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
        {upperFirst(t('common.messages.is_empty'))}
        </div>
      )}
    </div>
  );
}
