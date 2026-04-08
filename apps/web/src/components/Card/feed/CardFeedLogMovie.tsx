"use client"

import { Link } from "@/lib/i18n/navigation";
import MediaPoster from "@/components/Media/MediaPoster";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CardUser } from "@/components/Card/CardUser";
import { IconMediaRating } from "@/components/Media/icons/IconMediaRating";
import { Icons } from "@/config/icons";
import { forwardRef } from "react";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { FeedItemLogMovie } from "@libs/api-js";
import { CardReviewMovie } from "../CardReviewMovie";
import { upperFirst } from "lodash";

const FeedActivity = ({
	data,
	className,
}: {
	data: FeedItemLogMovie;
	className?: string;
}) => {
	const t = useTranslations('pages.feed.actions');
	return (
	  <div className={cn("space-x-2", className)}>
		{data?.content.review ? (
		  <>
			<span>
			  {t.rich('reviewed', {
				name: () => (
				  <Link href={`/@${data.author.username}`} className="text-foreground hover:underline">
					{data.author.username}
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
			{data?.content.isLiked && data?.content.rating ? (
			  <span>
				{t.rich('rated_liked', {
				  name: () => (
					<Link href={`/@${data.author.username}`} className="text-foreground hover:underline">
					  {data.author.username}
					</Link>
				  ),
				})}
			  </span>
			) : data?.content.isLiked && !data?.content.rating ? (
			  <span>
				{t.rich('liked', {
				  name: () => (
					<Link href={`/@${data.author.username}`} className="text-foreground hover:underline">
					  {data.author.username}
					</Link>
				  ),
				})}
			  </span>
			) : !data?.content.isLiked && data?.content.rating ? (
			  <span>
				{t.rich('rated', {
				  name: () => (
					<Link href={`/@${data.author.username}`} className="text-foreground hover:underline">
					  {data.author.username}
					</Link>
				  ),
				})}
			  </span>
			) : (
			  <span>
				{t.rich('watched', {
				  name: () => (
					<Link href={`/@${data.author.username}`} className="text-foreground hover:underline">
					  {data.author.username}
					</Link>
				  ),
				})}
			  </span>
			)}
		  	{data?.content.rating && (
				<IconMediaRating
				rating={data.content.rating}
				className="inline-flex"
				/>
			)}
			{data?.content.isLiked && (
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

interface CardFeedLogMovieProps extends React.HTMLAttributes<HTMLDivElement> {
	data: FeedItemLogMovie;
}

export const CardFeedLogMovie = forwardRef<
	HTMLDivElement,
	CardFeedLogMovieProps
>(({ data, ...props }, ref) => {
	const t = useTranslations();
	const format = useFormatter();
	return (
	  <div ref={ref} className="@container/feed-item flex gap-4 bg-muted rounded-xl p-2 group" {...props}>
		<MediaPoster
		className="w-20 @md/feed-item:w-24"
		src={getTmdbImage({ path: data.content.movie?.posterPath, size: 'w342' })}
		alt={data.content.movie?.title ?? ''}
		width={96}
		height={144}
		unoptimized
		classNameFallback="h-full"
		/>
		<div className="flex flex-col gap-4 w-full">
			<div className="flex justify-between">
				<div className="flex items-center gap-1">
					<CardUser user={data.author} variant="icon" />
					<FeedActivity data={data} className="text-sm @md/feed-item:text-base text-muted-foreground"/>
				</div>
				{data.content.lastWatchedAt && <div className='hidden @md/feed-item:block text-sm text-muted-foreground opacity-0 group-hover:opacity-100 duration-500'>
					{format.relativeTime(new Date(data.content.lastWatchedAt), new Date())}
				</div>}
			</div>
			<Link href={data.content.movie?.url ?? ''} className="text-md @md/feed-item:text-xl space-x-1 line-clamp-2">
				<span className='font-bold'>{data.content.movie?.title}</span>
				{/* DATE */}
				{data.content.movie?.releaseDate && <sup>
					<DateOnlyYearTooltip date={data.content.movie.releaseDate} className='text-xs @md/feed-item:text-sm font-medium'/>
				</sup>}
			</Link>
			{data.content.review ? (
				<CardReviewMovie
				className="bg-background"
				review={data.content.review}
				author={data.author}
				rating={data.content.rating}
				url={`/@${data.author.username}/film/${data.content.movie?.slug || data.content.movie?.id}`}
				/>
			) : data.content.movie.overview && (
				<p className={cn("text-xs @md/feed-item:text-sm line-clamp-3 text-justify", !data.content.movie.overview.length && 'text-muted-foreground')}>
					{data.content.movie.overview.length ? data.content.movie.overview : upperFirst(t('common.messages.no_overview'))}
				</p>
			)}
		</div>
	  </div>
	);
});
CardFeedLogMovie.displayName = 'CardFeedLogMovie';