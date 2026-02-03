import * as React from "react"
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/i18n/navigation";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { useFormatter, useTranslations } from "next-intl";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { UserAvatar } from "@/components/User/UserAvatar";
import { UserFeedCastCrew } from "@recomendapp/types";
import { upperFirst } from "lodash";
import { ContextMenuMovie } from "@/components/ContextMenu/ContextMenuMovie";
import { getMediaDetails } from "@/utils/get-media-details";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

interface FeedCastCrewItemProps
	extends React.ComponentProps<typeof Card> {
		activity: UserFeedCastCrew;
	}

const FeedCastCrewItemDefault = React.forwardRef<
	HTMLDivElement,
	FeedCastCrewItemProps
>(({ className, activity, ...props }, ref) => {
	const format = useFormatter();
	const t = useTranslations();
	const details = getMediaDetails({ type: 'movie', media: activity.movie! })
	return (
		<Card
		ref={ref}
		className={cn(
			"@container/feed-item flex flex-row gap-4 p-2",
			className
		)}
		{...props}
		>
			<Link
			href={activity?.movie?.url ?? ''}
			className="w-20 @md/feed-item:w-24 relative h-full shrink-0 rounded-md overflow-hidden aspect-2/3"
			>
				<ImageWithFallback
				src={getTmdbImage({ path: activity?.movie?.poster_path ?? '', size: 'w342' })}
				alt={activity?.movie?.title ?? ''}
				fill
				className="object-cover"
				type="movie"
				unoptimized
				/>
			</Link>
			<div className="flex flex-col gap-4 w-full">
				<div className="flex justify-between gap-2">
					{/* PERSON */}
					<div className="flex gap-2">
						<Link href={activity?.person?.url ?? ''} className="shrink-0">
							{activity?.person?.name ? <UserAvatar className="w-8 h-8 rounded-md" avatarUrl={activity?.person?.profile_url ?? ''} username={activity?.person?.name} /> : null}
						</Link>
						<p className="text-muted-foreground line-clamp-2">
							{t.rich('pages.feed.cast_and_crew.new_activity', {
								name: activity?.person?.name!,
								roles: activity?.jobs?.length ? activity.jobs.join(', ').toLowerCase() : t('common.messages.unknown'),
								film: activity?.movie?.title!,
								linkPerson: (chunk) => <Link href={activity?.person?.url ?? ''} className="text-foreground hover:underline underline-offset-2 hover:text-accent-pink">{chunk}</Link>,
								linkFilm: (chunk) => <Link href={activity?.movie?.url ?? ''} className="text-foreground hover:underline underline-offset-2 hover:text-accent-pink">{chunk}</Link>,
								important: (chunk) => <span className="text-foreground">{chunk}</span>
							})}
						</p>
					</div>
					{activity?.movie?.release_date ? <div className='hidden @md/feed-item:block text-sm text-muted-foreground'>
						{format.relativeTime(new Date(activity?.movie.release_date ?? ''), new Date())}
					</div> : null}
				</div>
				{activity.movie && <Link href={activity?.movie?.url ?? ''} className="space-y-2">
					<div className="text-md @md/feed-item:text-xl space-x-1 line-clamp-2">
						<span className='font-bold'>{activity?.movie?.title}</span>
						{activity?.movie?.release_date && <sup>
							<DateOnlyYearTooltip date={activity.movie.release_date} className='text-xs @md/feed-item:text-sm font-medium'/>
						</sup>}
					</div>
					<p
						className={`
							text-xs @md/feed-item:text-sm line-clamp-3 text-justify
							${details.description && details.description.length ? '' : 'text-muted-foreground'}
						`}
					>
						{details.description && activity.movie?.overview?.length ? details.description : upperFirst(t('common.messages.no_overview'))}
					</p>
				</Link>}
			</div>

		</Card>
	  );
});
FeedCastCrewItemDefault.displayName = "FeedCastCrewItem";

const FeedCastCrewItem = React.forwardRef<
	HTMLDivElement,
	FeedCastCrewItemProps
>(({ className, activity, ...props }, ref) => {
	return (
		<ContextMenuMovie movie={activity?.movie!}>
			<FeedCastCrewItemDefault ref={ref} className={className} activity={activity} {...props} />
		</ContextMenuMovie>
	)
});
FeedCastCrewItem.displayName = "FeedCastCrewItem";

export {
	type FeedCastCrewItemProps,
	FeedCastCrewItem,
	FeedCastCrewItemDefault
}