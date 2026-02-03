"use client"

import { Link } from "@/lib/i18n/navigation";
import MediaPoster from "@/components/Media/MediaPoster";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { useFormatter, useTranslations } from "next-intl";
import { Profile, UserActivityMovie } from "@recomendapp/types";
import { cn } from "@/lib/utils";
import { CardUser } from "@/components/Card/CardUser";
import { IconMediaRating } from "@/components/Media/icons/IconMediaRating";
import { Icons } from "@/config/icons";
import { CardReviewMovie } from "@/components/Card/CardReviewMovie";
import { upperFirst } from "lodash";
import { forwardRef } from "react";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

const FeedActivity = ({
	author,
	activity,
	className,
}: {
	author: Profile;
	activity: UserActivityMovie;
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

interface CardFeedActivityMovieProps extends React.HTMLAttributes<HTMLDivElement> {
	author: Profile;
	activity: UserActivityMovie;
}

export const CardFeedActivityMovie = forwardRef<
	HTMLDivElement,
	CardFeedActivityMovieProps
>(({ author, activity, ...props }, ref) => {
	const format = useFormatter();
	const t = useTranslations();
	return (
	  <div ref={ref} className="@container/feed-item flex gap-4 bg-muted rounded-xl p-2 group" {...props}>
		<MediaPoster
		className="w-20 @md/feed-item:w-24"
		src={getTmdbImage({ path: activity.movie?.poster_path, size: 'w342' })}
		alt={activity.movie?.title ?? ''}
		width={96}
		height={144}
		unoptimized
		classNameFallback="h-full"
		/>
		<div className="flex flex-col gap-4 w-full">
			<div className="flex justify-between">
				<div className="flex items-center gap-1">
					<CardUser user={author} variant="icon" />
					<FeedActivity author={author} activity={activity} className="text-sm @md/feed-item:text-base text-muted-foreground"/>
				</div>
				{activity.watched_date && <div className='hidden @md/feed-item:block text-sm text-muted-foreground opacity-0 group-hover:opacity-100 duration-500'>
					{format.relativeTime(new Date(activity.watched_date), new Date())}
				</div>}
			</div>
			<Link href={activity.movie?.url ?? ''} className="text-md @md/feed-item:text-xl space-x-1 line-clamp-2">
				<span className='font-bold'>{activity.movie?.title}</span>
				{/* DATE */}
				{activity.movie?.release_date && <sup>
					<DateOnlyYearTooltip date={activity.movie.release_date} className='text-xs @md/feed-item:text-sm font-medium'/>
				</sup>}
			</Link>
			{activity.review ? (
				<CardReviewMovie
				className="bg-background"
				review={activity.review}
				activity={activity}
				author={author}
				url={`${activity.movie?.url}/review/${activity.review.id}`}
				/>
			) : activity.movie?.overview && (
				<p className={cn("text-xs @md/feed-item:text-sm line-clamp-3 text-justify", !activity.movie.overview.length && 'text-muted-foreground')}>
					{activity.movie.overview.length ? activity.movie.overview : upperFirst(t('common.messages.no_overview'))}
				</p>
			)}
		</div>
	  </div>
	);
});
CardFeedActivityMovie.displayName = 'CardFeedActivityMovie';