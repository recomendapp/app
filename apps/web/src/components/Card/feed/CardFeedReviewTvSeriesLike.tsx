"use client"

import { Link } from "@/lib/i18n/navigation";
import MediaPoster from "@/components/Media/MediaPoster";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { useFormatter, useTranslations } from "next-intl";
import { CardUser } from "@/components/Card/CardUser";
import { forwardRef } from "react";
import { CardReviewTvSeries } from "@/components/Card/CardReviewTvSeries";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { FeedItemReviewTvSeriesLike } from "@libs/api-js";

interface CardFeedReviewTvSeriesLikeProps extends React.HTMLAttributes<HTMLDivElement> {
	data: FeedItemReviewTvSeriesLike;
}

export const CardFeedReviewTvSeriesLike = forwardRef<
	HTMLDivElement,
	CardFeedReviewTvSeriesLikeProps
>(({ data, ...props }, ref) => {
	const format = useFormatter();
	const t = useTranslations();
	const { tvSeries, author, rating, ...review } = data.content;
	return (
	  <div ref={ref} className="@container/feed-item flex gap-4 bg-muted rounded-xl p-2 group" {...props}>
		<MediaPoster
		className="w-20 @md/feed-item:w-24"
		src={getTmdbImage({ path: tvSeries.posterPath, size: 'w342' })}
		alt={tvSeries.name ?? ''}
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
			<Link href={tvSeries.url ?? ''} className="text-md @md/feed-item:text-xl space-x-1 line-clamp-2">
				<span className='font-bold'>{tvSeries.name}</span>
				{/* DATE */}
				{tvSeries.firstAirDate && <sup>
					<DateOnlyYearTooltip date={tvSeries.firstAirDate} className='text-xs @md/feed-item:text-sm font-medium'/>
				</sup>}
			</Link>
			<CardReviewTvSeries
			className="bg-background"
			review={review}
			author={author}
			rating={rating}
			url={`/@${author.username}/tv-series/${tvSeries.slug || tvSeries.id}`}
			/>
		</div>
	  </div>
	);
});
CardFeedReviewTvSeriesLike.displayName = 'CardFeedReviewTvSeriesLike';