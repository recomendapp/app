import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/i18n/navigation";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { useFormatter, useTranslations } from "next-intl";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { UserAvatar } from "@/components/User/UserAvatar";
import { ContextMenuMovie } from "@/components/ContextMenu/ContextMenuMovie";
import { getMediaDetails } from "@/utils/get-media-details";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { FeedPersonItem } from "@libs/api-js";
import { ContextMenuTvSeries } from "@/components/ContextMenu/ContextMenuTvSeries";
import { forwardRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

interface FeedPersonsItemProps
	extends React.ComponentProps<typeof Card> {
		item: FeedPersonItem;
	}

const FeedPersonsItemDefault = forwardRef<
	HTMLDivElement,
	FeedPersonsItemProps
>(({ className, item, ...props }, ref) => {
	const format = useFormatter();
	const t = useTranslations();
	const details = useMemo(() => {
		switch (item.type) {
			case 'movie':
				return getMediaDetails({ type: 'movie', media: item.media });
			case 'tv_series':
				return getMediaDetails({ type: 'tv_series', media: item.media });
			default:
				return null;
		}
	}, [item]);
	return (
		<Card
		ref={ref}
		className={cn(
			"@container/feed-item flex flex-row gap-4 p-2",
			className
		)}
		{...props}
		>
			<div
			// href={activity?.movie?.url ?? ''}
			className="w-20 @md/feed-item:w-24 relative h-full shrink-0 rounded-md overflow-hidden aspect-2/3"
			>
				<ImageWithFallback
				src={getTmdbImage({ path: item.media.posterPath ?? '', size: 'w342' })}
				alt={details?.title ?? ''}
				fill
				className="object-cover"
				type="movie"
				unoptimized
				/>
			</div>
			<div className="flex flex-col gap-4 w-full">
				<div className="flex justify-between gap-2">
					{/* PERSON */}
					<div className="flex gap-2">
						<Link href={item.person.url || ''} className="shrink-0">
							<UserAvatar className="w-8 h-8 rounded-md" avatarUrl={getTmdbImage({ path: item.person.profilePath, size: 'w92' })} username={item.person.name ?? ''} />
						</Link>
						<p className="text-muted-foreground line-clamp-2">
							{t.rich('pages.feed.persons.new_activity', {
								name: item.person.name || t('common.messages.unknown'),
								roles: item.jobs.length ? item.jobs.join(', ').toLowerCase() : t('common.messages.unknown'),
								titleMedia: details?.title || t('common.messages.unknown'),
								linkPerson: (chunk) => <Link href={item.person.url ?? ''} className="text-foreground hover:underline underline-offset-2 hover:text-accent-pink">{chunk}</Link>,
								linkMedia: (chunk) => <Link href={item.media.url ?? ''} className="text-foreground hover:underline underline-offset-2 hover:text-accent-pink">{chunk}</Link>,
								important: (chunk) => <span className="text-foreground">{chunk}</span>
							})}
						</p>
					</div>
					{item.date ? <div className='hidden @md/feed-item:block text-sm text-muted-foreground'>
						{format.relativeTime(new Date(item.date), new Date())}
					</div> : null}
				</div>
				{item.media && <Link href={item.media.url ?? ''} className="space-y-2">
					<div className="text-md @md/feed-item:text-xl space-x-1 line-clamp-2">
						<span className='font-bold'>{details?.title}</span>
						{(item.type === 'movie' && item.media.releaseDate) && <sup>
							<DateOnlyYearTooltip date={item.media.releaseDate} className='text-xs @md/feed-item:text-sm font-medium'/>
						</sup>}
					</div>
					<Badge variant={item.type}>{t(`common.messages.${item.type}`, { count: 1 })}</Badge>
				</Link>}
			</div>

		</Card>
	  );
});
FeedPersonsItemDefault.displayName = "FeedPersonsItem";

const FeedPersonsItem = forwardRef<
	HTMLDivElement,
	FeedPersonsItemProps
>(({ className, ...props }, ref) => {
	return (
		<ContextMenu item={props.item}>
			<FeedPersonsItemDefault ref={ref} className={className} {...props} />
		</ContextMenu>
	)
});
FeedPersonsItem.displayName = "FeedPersonsItem";

export {
	type FeedPersonsItemProps,
	FeedPersonsItem,
	FeedPersonsItemDefault
}

const ContextMenu = ({ item, children }: { item: FeedPersonItem, children: React.ReactNode }) => {
	if (item.type === 'movie') {
		return (
			<ContextMenuMovie movie={item.media}>
				{children}
			</ContextMenuMovie>
		);
	} else if (item.type === 'tv_series') {
		return (
			<ContextMenuTvSeries tvSeries={item.media}>
				{children}
			</ContextMenuTvSeries>
		);
	} else {
		return children;
	}
};
	