import * as React from "react"
import { Button } from "@/components/ui/button";
import { DateOnlyYearTooltip } from "@/components/utils/Date";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { cn } from "@/lib/utils";
import { MediaMovie, MediaPerson } from "@recomendapp/types";
import { Link } from "@/lib/i18n/navigation";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

interface ItemProps
	extends React.ComponentProps<'div'> {
		movie: MediaMovie;
	}

export const Item = React.forwardRef<
	HTMLDivElement,
	ItemProps
>(({ movie, className, ...props }, ref) => {
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
				src={getTmdbImage({ path: movie.poster_path, size: 'w342' })}
				alt={movie.title ?? ''}
				className={cn("object-cover")}
				width={60}
          		height={90}
				unoptimized
				type={'movie'}
				{...props}
				/>
			</div>
			<div className="flex-1">
				<Link href={movie.url ?? ''} className="font-medium line-clamp-2">
				{movie.title}
				</Link>
				<Credits credits={movie.directors ?? []} className="line-clamp-1" />
				{movie.release_date ? <p className="lg:hidden">
					<DateOnlyYearTooltip date={movie.release_date} />
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
  