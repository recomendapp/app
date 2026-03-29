"use client"

import { Link } from "@/lib/i18n/navigation";
import MediaPoster from "@/components/Media/MediaPoster";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { useFormatter, useTranslations } from "next-intl";
import { CardUser } from "@/components/Card/CardUser";
import { CardReviewMovie } from "@/components/Card/CardReviewMovie";
import { forwardRef } from "react";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { FeedItemReviewMovieLike } from "@packages/api-js";

interface CardFeedReviewMovieLikeProps extends React.HTMLAttributes<HTMLDivElement> {
	data: FeedItemReviewMovieLike;
}

export const CardFeedReviewMovieLike = forwardRef<
	HTMLDivElement,
	CardFeedReviewMovieLikeProps
>(({ data, ...props }, ref) => {
	const format = useFormatter();
	const t = useTranslations();
	const { movie, author, rating, ...review } = data.content;
	return (
	  <div ref={ref} className="@container/feed-item flex gap-4 bg-muted rounded-xl p-2 group" {...props}>
		<MediaPoster
		className="w-20 @md/feed-item:w-24"
		src={getTmdbImage({ path: movie.posterPath, size: 'w342' })}
		alt={movie.title ?? ''}
		width={96}
		height={144}
		unoptimized
		classNameFallback="h-full"
		/>
		<div className="flex flex-col gap-4 w-full">
			<div className="flex justify-between">
				{/* USER */}
				<div className="flex items-center gap-1">
					<CardUser user={data.author} variant="icon" />
					<p className="text-sm @md/feed-item:text-base text-muted-foreground">
						{t.rich('common.messages.user_liked_review', {
							name: () => (
								<Link href={`/@${data.author.username}`} className="text-foreground hover:underline">
									{data.author.username}
								</Link>
							)
						})}
					</p>
				</div>
				<div className='hidden @md/feed-item:block text-sm text-muted-foreground opacity-0 group-hover:opacity-100 duration-500'>
					{format.relativeTime(new Date(review.createdAt), new Date())}
				</div>
			</div>
			<Link href={movie.url ?? ''} className="text-md @md/feed-item:text-xl space-x-1 line-clamp-2">
				<span className='font-bold'>{movie.title}</span>
				{/* DATE */}
				{movie.releaseDate && <sup>
					<DateOnlyYearTooltip date={movie.releaseDate} className='text-xs @md/feed-item:text-sm font-medium'/>
				</sup>}
			</Link>
			<CardReviewMovie
			className="bg-background"
			review={review}
			author={author}
			rating={rating}
			url={`/@${author.username}/film/${movie.slug || movie.id}`}
			/>
		</div>
	  </div>
	);
});
CardFeedReviewMovieLike.displayName = 'CardFeedReviewMovieLike';