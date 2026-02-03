'use client';
import * as React from "react"
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { MediaPerson, MediaTvSeries, UserActivityTvSeries } from "@recomendapp/types";
import { ImageWithFallback } from "../utils/ImageWithFallback";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { TooltipBox } from "../Box/TooltipBox";
import { Button } from "../ui/button";
import { BadgeMedia } from "../Badge/BadgeMedia";
import { Icons } from "@/config/icons";
import { IconMediaRating } from "@/components/Media/icons/IconMediaRating";
import { useUI } from "@/context/ui-context";
import { DateOnlyYearTooltip } from "../utils/Date";
import { WithLink } from "../utils/WithLink";
import ButtonUserActivityTvSeriesWatch from "../buttons/ButtonUserActivityTvSeriesWatch";
import ButtonUserWatchlistTvSeries from "../buttons/ButtonUserWatchlistTvSeries";
import { ContextMenuTvSeries } from "../ContextMenu/ContextMenuTvSeries";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

interface CardTvSeriesProps
	extends React.ComponentProps<typeof Card> {
		variant?: "default" | "poster" | "row";
		tvSeries: MediaTvSeries;
		activity?: UserActivityTvSeries;
		profileActivity?: UserActivityTvSeries;
		linked?: boolean;
		posterClassName?: string;
		disableActions?: boolean;
		showRating?: boolean;
		hideMediaType?: boolean;
	}

const CardTvSeriesDefault = React.forwardRef<
	HTMLDivElement,
	Omit<CardTvSeriesProps, "variant">
>(({ className, tvSeries, activity, profileActivity, children, linked, showRating, posterClassName, ...props }, ref) => {
	return (
	<WithLink href={tvSeries.url ?? undefined}>
		<Card
			ref={ref}
			className={cn(
				"flex-row gap-2 items-center rounded-xl h-20 bg-muted hover:bg-muted-hover p-1",
				className
			)}
			{...props}
		>
			<div
			className={cn('relative h-full shrink-0 rounded-md overflow-hidden aspect-2/3', posterClassName)}
			>
				<ImageWithFallback
				src={getTmdbImage({ path: tvSeries.poster_path, size: 'w342' })}
				alt={tvSeries.name ?? ''}
				fill
				className="object-cover"
				type='tv_series'
				unoptimized
				/>
			</div>
			<div className='px-2 py-1 space-y-1'>
				<p className='line-clamp-2 wrap-break-word'>{tvSeries.name}</p>
				{children}
			</div>
		</Card>
	</WithLink>
	);
});
CardTvSeriesDefault.displayName = "CardTvSeriesDefault";

const CardTvSeriesPoster = React.forwardRef<
	HTMLDivElement,
	Omit<CardTvSeriesProps, "variant">
>(({ className, tvSeries, activity, profileActivity, linked, disableActions, showRating, children, ...props }, ref) => {
	const { device } = useUI();
	const [isHovered, setIsHovered] = React.useState(false);
	return (
		<TooltipBox tooltip={`${tvSeries.name}${tvSeries.first_air_date ? ` (${(new Date(tvSeries.first_air_date)).getFullYear()})` : ''}`} side='top'>
			<Card
				ref={ref}
				className={cn(
					"group relative transition flex-row gap-4 items-center w-32 shrink-0 rounded-md",
					"border-transparent hover:border-accent-yellow",
					"aspect-2/3 overflow-hidden",
					className
				)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				{...props}
			>
				<ImageWithFallback
				src={getTmdbImage({ path: tvSeries.poster_path, size: 'w342' })}
				alt={tvSeries.name ?? ''}
				fill
				className="object-cover"
				type='tv_series'
				unoptimized
				/>
				{(tvSeries.vote_average
				|| profileActivity?.rating
				|| profileActivity?.is_liked
				|| profileActivity?.review
				) ? (
					<div className='absolute top-1 right-1 flex flex-col gap-1'>
						{tvSeries.vote_average ?
						<IconMediaRating
						disableTooltip
						rating={tvSeries.vote_average}
						/> : null}
						{(profileActivity?.is_liked
						|| profileActivity?.rating
						|| profileActivity?.review) ? (
						<IconMediaRating
						disableTooltip
						rating={profileActivity.rating}
						variant="profile"
						/>) : null}
					</div>
				) : null}
				{(device === 'desktop' && !disableActions) ? (
					<div className="hidden absolute bottom-2 group-hover:flex w-full justify-center pointer-events-none">
					{isHovered ? (
						<div className="space-x-2 w-fit pointer-events-auto">
							<ButtonUserActivityTvSeriesWatch tvSeriesId={tvSeries.id} className="bg-background!" />
							<ButtonUserWatchlistTvSeries tvSeriesId={tvSeries.id} className="bg-background!" />
						</div>
					) : null}
					</div>
				) : null}
			</Card>
		</TooltipBox>
	);
});
CardTvSeriesPoster.displayName = "CardTvSeriesPoster";

const CardTvSeriesRow = React.forwardRef<
	HTMLDivElement,
	Omit<CardTvSeriesProps, "variant">
>(({ className, posterClassName, tvSeries, activity, profileActivity, hideMediaType, linked, showRating, children, ...props }, ref) => {
	// const mediaUrlPrefix = getMediaUrlPrefix(tvSeries.media_type!);
	return (
		<Card
			ref={ref}
			className={cn(
				"group flex-row gap-4 items-center p-1",
				linked ? "hover:bg-muted-hover" : "",
				className
			)}
			{...props}
		>
			<div className={cn("relative w-24 aspect-2/3 rounded-md overflow-hidden", posterClassName)}>
				<ImageWithFallback
				src={getTmdbImage({ path: tvSeries.poster_path, size: 'w342' })}
				alt={tvSeries.name ?? ''}
				fill
				className="object-cover"
				type={'tv_series'}
				unoptimized
				/>
			</div>
			<div className="flex items-center gap-4 justify-between w-full">
				<div className='space-y-1'>
					<div className="flex items-center gap-2">
						<WithLink
						href={linked ? (tvSeries.url ?? '') : undefined}
						className='line-clamp-2 wrap-break-word'
						onClick={linked ? (e) => e.stopPropagation() : undefined}
						>
							{tvSeries.name}
						</WithLink>
						{profileActivity?.rating && (
							<WithLink
							href={linked ? `/@${profileActivity?.user?.username}/tv-series/${tvSeries.slug ?? tvSeries.id}` : undefined}
							className="pointer-events-auto"
							onClick={linked ? (e) => e.stopPropagation() : undefined}
							>
								<IconMediaRating
								rating={profileActivity.rating}
								className="inline-flex"
								/>
							</WithLink>
						)}
						{profileActivity?.is_liked && (
							<Link
							href={`/@${profileActivity?.user?.username}/tv-series/${tvSeries.slug ?? tvSeries.id}`}
							className="pointer-events-auto"
							onClick={linked ? (e) => e.stopPropagation() : undefined}
							>
								<Icons.like
								size={24}
								className="text-accent-pink fill-accent-pink inline-flex"
								/>
							</Link>
						)}
						{profileActivity?.review && (
							<Link
							href={`${tvSeries.url}/review/${profileActivity.review.id}`}
							className="pointer-events-auto"
							onClick={linked ? (e) => e.stopPropagation() : undefined}
							>
								<Icons.comment
								size={24}
								className="text-foreground inline-flex"
								/>
							</Link>
						)}
					</div>
					{tvSeries.created_by && <Credits credits={tvSeries.created_by} linked={linked} className="line-clamp-2"/>}
					{!hideMediaType && <BadgeMedia type='tv_series' />}
				</div>
				{tvSeries.first_air_date ? (
					<DateOnlyYearTooltip date={tvSeries.first_air_date} className="text-xs text-muted-foreground"/>
				) : null}
			</div>
		</Card>
	);
});
CardTvSeriesRow.displayName = "CardTvSeriesRow";

const CardTvSeries = React.forwardRef<
	HTMLDivElement,
	CardTvSeriesProps
>(({ className, tvSeries, hideMediaType = true, onClick, showRating = true, linked = true, variant = "default", ...props }, ref) => {
	const router = useRouter();
	const customOnClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (linked && tvSeries.url) {
			router.push(tvSeries.url);
		}
		onClick && onClick(e);
	};
	return (
	<ContextMenuTvSeries tvSeries={tvSeries}>
		{variant === "default" ? (
			<CardTvSeriesDefault ref={ref} className={cn(linked ? 'cursor-pointer' : '', className)} tvSeries={tvSeries} linked={linked} onClick={customOnClick} showRating={showRating} {...props} />
		) : variant == "poster" ? (
			<CardTvSeriesPoster ref={ref} className={cn(linked ? 'cursor-pointer' : '', className)} tvSeries={tvSeries} linked={linked} onClick={customOnClick} showRating={showRating} {...props} />
		) : variant == "row" ? (
			<CardTvSeriesRow ref={ref} className={cn(linked ? 'cursor-pointer' : '', className)} tvSeries={tvSeries} linked={linked} onClick={customOnClick} showRating={showRating} hideMediaType={hideMediaType} {...props} />
		) : null}
	</ContextMenuTvSeries>
	);
});
CardTvSeries.displayName = "CardTvSeries";

export {
	type CardTvSeriesProps,
	CardTvSeries,
	CardTvSeriesDefault,
	CardTvSeriesPoster,
	CardTvSeriesRow,
}
  

const Credits = ({
	credits,
	linked,
	className,
} : {
	credits: MediaPerson[];
	linked?: boolean;
	className?: string;
}) => {
	if (!credits || credits.length === 0) return null;
	return (
	  <p className={cn('line-clamp-1', className)}>
		{credits?.map((credit, index) => (
		  <span key={index}>
			<Button
			  variant={'link'}
			  className={`
				w-fit p-0 h-full italic text-muted-foreground transition
				${linked ? 'hover:text-accent-yellow' : 'hover:text-muted-foreground hover:no-underline'}
			`}
			  asChild
			>
			  <WithLink
			  href={linked ? (credit.url ?? '') : undefined}
			  onClick={linked ? (e) => e.stopPropagation() : undefined}
			  >
				{credit.name}
			  </WithLink>
			</Button>
			{index !== credits.length - 1 && (
			  <span className='text-muted-foreground'>, </span>
			)}
		  </span>
		))}
	  </p>
	)
}