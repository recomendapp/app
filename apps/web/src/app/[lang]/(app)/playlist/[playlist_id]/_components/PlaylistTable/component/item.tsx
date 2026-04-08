import { Button } from "@/components/ui/button";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { cn } from "@/lib/utils";
import { Link } from "@/lib/i18n/navigation";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { useFormatter } from "next-intl";
import { getMediaDetails } from "@/utils/get-media-details";
import { PersonCompact, PlaylistItemWithMedia } from "@libs/api-js";
import { forwardRef, useMemo } from "react";
import { BadgeMedia } from "@/components/Badge/BadgeMedia";

interface ItemProps
	extends React.ComponentProps<'div'> {
		data: PlaylistItemWithMedia;
	}

export const Item = forwardRef<
	HTMLDivElement,
	ItemProps
>(({ data, className, ...props }, ref) => {
	const details = useMemo(() => {
		switch (data.type) {
			case 'movie':
				return getMediaDetails({ type: 'movie', media: data.media });
			case 'tv_series':
				return getMediaDetails({ type: 'tv_series', media: data.media });
		}
	}, [data]);
	return (
		<div ref={ref} className={cn("flex gap-4 items-center", className)} {...props}>
			<div
				className={cn(
				'shadow-md relative shrink-0 overflow-hidden rounded-md',
				'aspect-2/3',
				className
				)}
			>
				<ImageWithFallback
				src={getTmdbImage({ path: details.imagePath, size: 'w342' })}
				alt={details.title ?? ''}
				className={cn("object-cover")}
				width={60}
          		height={90}
				unoptimized
				type={data.type}
				{...props}
				/>
			</div>
			<div className="flex-1 space-y-0.5">
				<Link href={data.media.url ?? ''} className="font-medium line-clamp-2">
				{details.title}
				</Link>
				<p className="line-clamp-1 text-muted-foreground">
					<Credits credits={details.credits}  />
				</p>
				{details.date ? <p className="lg:hidden">
					<DateOnlyYearTooltip date={details.date} />
				</p> : null}
				<BadgeMedia type={data.type} />
			</div>
		</div>
	);
})
Item.displayName = 'Item';


const Credits = ({
	credits,
  }: {
	credits: PersonCompact[] | null;
  }) => {
	const format = useFormatter();
	const formattedCredits = useMemo(() => credits?.map(credit => (
		<Button key={credit.id} variant={'link'} className="w-fit p-0 h-full italic text-muted-foreground hover:text-accent-yellow transition" asChild>
			<Link href={credit.url ?? ''}>
				{credit.name}
			</Link>
		</Button>
	)), [credits]);
		
	if (!formattedCredits || formattedCredits.length === 0) return null;
	return format.list(formattedCredits, { type: 'unit'});
}