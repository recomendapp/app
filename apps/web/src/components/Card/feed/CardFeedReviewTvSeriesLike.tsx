"use client"

import { Link } from "@/lib/i18n/navigation";
import MediaPoster from "@/components/Media/MediaPoster";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { useFormatter, useTranslations } from "next-intl";
import { Profile, UserReviewTvSeriesLike } from "@recomendapp/types";
import { CardUser } from "@/components/Card/CardUser";
import { forwardRef } from "react";
import { CardReviewTvSeries } from "@/components/Card/CardReviewTvSeries";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

interface CardFeedReviewTvSeriesLikeProps extends React.HTMLAttributes<HTMLDivElement> {
	author: Profile;
	reviewLike: UserReviewTvSeriesLike;
}

export const CardFeedReviewTvSeriesLike = forwardRef<
	HTMLDivElement,
	CardFeedReviewTvSeriesLikeProps
>(({ author, reviewLike, ...props }, ref) => {
	const format = useFormatter();
	const t = useTranslations();
	const { tv_series } = reviewLike.review?.activity || {};
	return (
	  <div ref={ref} className="@container/feed-item flex gap-4 bg-muted rounded-xl p-2 group" {...props}>
		<MediaPoster
		className="w-20 @md/feed-item:w-24"
		src={getTmdbImage({ path: tv_series?.poster_path, size: 'w342' })}
		alt={tv_series?.name ?? ''}
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
					<p className="text-sm @md/feed-item:text-base text-muted-foreground">
						{t.rich('common.messages.user_liked_review', {
							name: () => (
								<Link href={`/@${author.username}`} className="text-foreground hover:underline">
									{author.username}
								</Link>
							)
						})}
					</p>
				</div>
				{reviewLike.created_at && <div className='hidden @md/feed-item:block text-sm text-muted-foreground opacity-0 group-hover:opacity-100 duration-500'>
					{format.relativeTime(new Date(reviewLike.created_at), new Date())}
				</div>}
			</div>
			<Link href={tv_series?.url ?? ''} className="text-md @md/feed-item:text-xl space-x-1 line-clamp-2">
				<span className='font-bold'>{tv_series?.name}</span>
				{/* DATE */}
				{tv_series?.first_air_date && <sup>
					<DateOnlyYearTooltip date={tv_series.first_air_date} className='text-xs @md/feed-item:text-sm font-medium'/>
				</sup>}
			</Link>
			{reviewLike.review && (
				<CardReviewTvSeries
				className="bg-background"
				review={reviewLike.review}
				activity={reviewLike.review.activity!}
				author={reviewLike.review.activity?.user!}
				url={`${tv_series?.url}/review/${reviewLike.review.id}`}
				/>
			)}
		</div>
	  </div>
	);
});
CardFeedReviewTvSeriesLike.displayName = 'CardFeedReviewTvSeriesLike';