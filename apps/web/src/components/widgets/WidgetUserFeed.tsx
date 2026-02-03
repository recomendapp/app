import { cn } from "@/lib/utils";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { CardFeedActivityMovie } from "../Card/feed/CardFeedActivityMovie";
import { CardFeedActivityTvSeries } from "../Card/feed/CardFeedActivityTvSeries";
import { CardFeedPlaylistLike } from "../Card/feed/CardFeedPlaylistLike";
import { CardFeedReviewMovieLike } from "../Card/feed/CardFeedReviewMovieLike";
import { CardFeedReviewTvSeriesLike } from "../Card/feed/CardFeedReviewTvSeriesLike";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useUserMyFeedInfiniteOptions } from "@/api/client/options/userOptions";

const WIDGET_USER_FEED_LIMIT = 4;

export const WidgetUserFeed = ({
	className,
} : React.HTMLAttributes<HTMLDivElement>) => {
	const t = useTranslations();
	const {
		data: feed,
		isLoading,
	} = useInfiniteQuery(useUserMyFeedInfiniteOptions());

	if (!feed || !feed.pages[0]?.length) return null;

	return (
		<div className={cn('@container/widget-user-feed space-y-4', className)}>
			<Button variant={'link'} className="p-0 w-fit font-semibold text-xl" asChild>
				<Link href={'/feed'}>
				{upperFirst(t('common.messages.latest_activity', { count: 0 }))}
				</Link>
			</Button>
			<div className="grid gap-2 grid-cols-1 @5xl/widget-user-feed:grid-cols-2">
				{feed.pages[0].slice(0, WIDGET_USER_FEED_LIMIT).map((item, index) => (
					item.activity_type === 'activity_movie' ? (
						<CardFeedActivityMovie key={index} author={item.author} activity={item.content} />
					) : item.activity_type === 'activity_tv_series' ? (
						<CardFeedActivityTvSeries key={index} author={item.author} activity={item.content} />
					) : item.activity_type === 'playlist_like' ? (
						<CardFeedPlaylistLike key={index} author={item.author} playlistLike={item.content} />
					) : item.activity_type === 'review_movie_like' ? (
						<CardFeedReviewMovieLike key={index} author={item.author} reviewLike={item.content} />
					) : item.activity_type === 'review_tv_series_like' ? (
						<CardFeedReviewTvSeriesLike key={index} author={item.author} reviewLike={item.content} />
					) : null
				))}
			</div>
		</div>
	)
}