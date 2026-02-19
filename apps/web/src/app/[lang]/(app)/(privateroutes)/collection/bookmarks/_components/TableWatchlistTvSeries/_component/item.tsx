import * as React from "react"
import { Button } from "@/components/ui/button";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { cn } from "@/lib/utils";
import { MediaTvSeries, MediaPerson } from "@recomendapp/types";
import { Link } from "@/lib/i18n/navigation";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

interface ItemProps
	extends React.ComponentProps<'div'> {
		tvSeries: MediaTvSeries;
	}

export const Item = React.forwardRef<
	HTMLDivElement,
	ItemProps
>(({ tvSeries, className, ...props }, ref) => {
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
				src={getTmdbImage({ path: tvSeries.poster_path, size: 'w342' })}
				alt={tvSeries.name ?? ''}
				className={cn("object-cover")}
				width={60}
          		height={90}
				unoptimized
				type={'tv_series'}
				{...props}
				/>
			</div>
			<div className="flex-1">
				<Link href={tvSeries.url ?? ''} className="font-medium line-clamp-2">
				{tvSeries.name}
				</Link>
				<Credits credits={tvSeries.created_by ?? []} className="line-clamp-1" />
				{tvSeries.first_air_date ? <p className="lg:hidden">
					<DateOnlyYearTooltip date={tvSeries.first_air_date} />
				</p> : null}
			</div>
		</div>
	);
})
Item.displayName = 'Item';


const Credits = ({
	credits,
	className,
  }: {
	credits: MediaPerson[];
	className?: string;
  }) => {
	if (!credits || credits.length === 0) return null;
	return (
	  <p className={cn('line-clamp-1', className)}>
		{credits?.map((credit, index: number) => (
		  <span key={index}>
			<Button
			  variant={'link'}
			  className="w-fit p-0 h-full italic text-muted-foreground hover:text-accent-yellow transition"
			  asChild
			>
			  <Link href={credit?.url ?? ''}>
				{credit.name}
			  </Link>
			</Button>
			{index !== credits.length - 1 && (
			  <span className='text-muted-foreground'>, </span>
			)}
		  </span>
		))}
	  </p>
	)
}
  