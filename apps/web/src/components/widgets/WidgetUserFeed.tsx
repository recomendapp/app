import { cn } from "@/lib/utils";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { upperFirst } from "lodash";
import { CardFeedPlaylistLike } from "../Card/feed/CardFeedPlaylistLike";
import { CardFeedReviewMovieLike } from "../Card/feed/CardFeedReviewMovieLike";
import { CardFeedReviewTvSeriesLike } from "../Card/feed/CardFeedReviewTvSeriesLike";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { CardFeedLogMovie } from "../Card/feed/CardFeedLogMovie";
import { CardFeedLogTvSeries } from "../Card/feed/CardFeedLogTvSeries";
import { meFeedInfiniteOptions } from "@libs/query-client/src";

const WIDGET_USER_FEED_LIMIT = 4;

export const WidgetUserFeed = ({
	className,
} : React.HTMLAttributes<HTMLDivElement>) => {
	const t = useTranslations();
	const { user } = useAuth();
	const {
		data: feed,
	} = useInfiniteQuery(meFeedInfiniteOptions({
		userId: user?.id
	}));

	if (!feed || !feed.pages[0]?.data.length) return null;

	return (
		<div className={cn('@container/widget-user-feed space-y-4', className)}>
			<Button variant={'link'} className="p-0 w-fit font-semibold text-xl" asChild>
				<Link href={'/feed'}>
				{upperFirst(t('common.messages.latest_activity', { count: 0 }))}
				</Link>
			</Button>
			<div className="grid gap-2 grid-cols-1 @5xl/widget-user-feed:grid-cols-2">
				{feed.pages[0].data.slice(0, WIDGET_USER_FEED_LIMIT).map((item, index) => (
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
				))}
			</div>
		</div>
	)
}