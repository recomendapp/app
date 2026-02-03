"use client"

import { Link } from "@/lib/i18n/navigation";
import MediaPoster from "@/components/Media/MediaPoster";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { useFormatter, useTranslations } from "next-intl";
import { Profile, UserActivityTvSeries } from "@recomendapp/types";
import { cn } from "@/lib/utils";
import { CardUser } from "@/components/Card/CardUser";
import { IconMediaRating } from "@/components/Media/icons/IconMediaRating";
import { Icons } from "@/config/icons";
import { upperFirst } from "lodash";
import { CardReviewTvSeries } from "@/components/Card/CardReviewTvSeries";
import { forwardRef } from "react";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

const FeedActivity = ({
	author,
	activity,
	className,
}: {
	author: Profile;
	activity: UserActivityTvSeries;
	className?: string;
}) => {
	const t = useTranslations('pages.feed.actions');
  
	return (
	  <div className={cn("space-x-2", className)}>
		{activity?.review ? (
		  <>
			<span>
			  {t.rich('reviewed', {
				name: () => (
				  <Link href={`/@${author.username}`} className="text-foreground hover:underline">
					{author.username}
				  </Link>
				),
				movie: () => (
					<></>
				),
			  })}
			</span>
		  </>
		) : (
		  <>
			{activity?.is_liked && activity?.rating ? (
			  <span>
				{t.rich('rated_liked', {
				  name: () => (
					<Link href={`/@${author.username}`} className="text-foreground hover:underline">
					  {author.username}
					</Link>
				  ),
				})}
			  </span>
			) : activity?.is_liked && !activity?.rating ? (
			  <span>
				{t.rich('liked', {
				  name: () => (
					<Link href={`/@${author.username}`} className="text-foreground hover:underline">
					  {author.username}
					</Link>
				  ),
				})}
			  </span>
			) : !activity?.is_liked && activity?.rating ? (
			  <span>
				{t.rich('rated', {
				  name: () => (
					<Link href={`/@${author.username}`} className="text-foreground hover:underline">
					  {author.username}
					</Link>
				  ),
				})}
			  </span>
			) : (
			  <span>
				{t.rich('watched', {
				  name: () => (
					<Link href={`/@${author.username}`} className="text-foreground hover:underline">
					  {author.username}
					</Link>
				  ),
				})}
			  </span>
			)}
		  	{activity?.rating && (
				<IconMediaRating
				rating={activity.rating}
				className="inline-flex"
				/>
			)}
			{activity?.is_liked && (
				<Icons.like
					size={24}
					className="text-background fill-accent-pink inline-flex"
				/>
			)}
		  </>
		)}
	  </div>
	);
};

interface CardFeedActivityTvSeriesProps extends React.HTMLAttributes<HTMLDivElement> {
	author: Profile;
	activity: UserActivityTvSeries;
}

export const CardFeedActivityTvSeries = forwardRef<
	HTMLDivElement,
	CardFeedActivityTvSeriesProps
>(({ author, activity, ...props }, ref) => {
	const format = useFormatter();
	const t = useTranslations();

	return (
	  <div ref={ref} className="@container/feed-item flex gap-4 bg-muted rounded-xl p-2 group" {...props}>
		<MediaPoster
		className="w-20 @md/feed-item:w-24"
		src={getTmdbImage({ path: activity.tv_series?.poster_path, size: 'w342' })}
		alt={activity.tv_series?.name ?? ''}
		width={96}
		height={144}
		unoptimized
		classNameFallback="h-full"
		/>
		<div className="flex flex-col gap-4 w-full">
			<div className="flex justify-between">
				{/* USER */}
				<div className="flex items-center gap-1">
					<CardUser user={author} variant="icon" />
					<FeedActivity author={author} activity={activity} className="text-sm @md/feed-item:text-base text-muted-foreground"/>
				</div>
				{activity.watched_date && <div className='hidden @md/feed-item:block text-sm text-muted-foreground opacity-0 group-hover:opacity-100 duration-500'>
					{format.relativeTime(new Date(activity.watched_date), new Date())}
				</div>}
			</div>
			<Link href={activity.tv_series?.url ?? ''} className="text-md @md/feed-item:text-xl space-x-1 line-clamp-2">
				<span className='font-bold'>{activity.tv_series?.name}</span>
				{/* DATE */}
				{activity.tv_series?.first_air_date && <sup>
					<DateOnlyYearTooltip date={activity.tv_series.first_air_date} className='text-xs @md/feed-item:text-sm font-medium'/>
				</sup>}
			</Link>
			{activity.review ? (
				<CardReviewTvSeries
				className="bg-background"
				review={activity.review}
				activity={activity}
				author={author}
				url={`${activity.tv_series?.url}/review/${activity.review.id}`}
				/>
			) : activity.tv_series?.overview && (
				<p className={cn("text-xs @md/feed-item:text-sm line-clamp-3 text-justify", !activity.tv_series.overview.length && 'text-muted-foreground')}>
					{activity.tv_series.overview.length ? activity.tv_series.overview : upperFirst(t('common.messages.no_overview'))}
				</p>
			)}
		</div>
	  </div>
	);
});
CardFeedActivityTvSeries.displayName = 'CardFeedActivityTvSeries';