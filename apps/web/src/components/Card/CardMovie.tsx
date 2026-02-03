'use client';
import * as React from "react"
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { MediaMovie, MediaPerson, UserActivityMovie } from "@recomendapp/types";
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
import ButtonUserActivityMovieWatch from "../buttons/ButtonUserActivityMovieWatch";
import ButtonUserWatchlistMovie from "../buttons/ButtonUserWatchlistMovie";
import { ContextMenuMovie } from "../ContextMenu/ContextMenuMovie";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

interface CardMovieProps
	extends React.ComponentProps<typeof Card> {
		variant?: "default" | "poster" | "row";
		movie: MediaMovie;
		activity?: UserActivityMovie;
		profileActivity?: UserActivityMovie;
		linked?: boolean;
		posterClassName?: string;
		disableActions?: boolean;
		showRating?: boolean;
		hideMediaType?: boolean;
	}

const CardMovieDefault = React.forwardRef<
	HTMLDivElement,
	Omit<CardMovieProps, "variant">
>(({ className, movie, activity, profileActivity, children, linked, showRating, posterClassName, ...props }, ref) => {
	return (
	// <WithLink href={movie.url ?? undefined}>
		<Card
			ref={ref}
			className={cn(
				"flex-row gap-2 items-center rounded-xl h-20 bg-muted p-1",
				linked ? 'hover:bg-muted-hover': '',
				className
			)}
			{...props}
		>
			<div
			className={cn('relative h-full shrink-0 rounded-md overflow-hidden aspect-2/3', posterClassName)}
			>
				<ImageWithFallback
				src={getTmdbImage({ path: movie.poster_path, size: 'w342' })}
				alt={movie.title ?? ''}
				fill
				className="object-cover"
				type='movie'
				unoptimized
				/>
			</div>
			<div className='px-2 py-1 space-y-1'>
				<p className='line-clamp-2 wrap-break-word'>{movie.title}</p>
				{children}
			</div>
		</Card>
	// </WithLink>
	);
});
CardMovieDefault.displayName = "CardMovieDefault";

const CardMoviePoster = React.forwardRef<
	HTMLDivElement,
	Omit<CardMovieProps, "variant">
>(({ className, movie, activity, profileActivity, linked, disableActions, showRating, children, ...props }, ref) => {
	const { device } = useUI();
	const [isHovered, setIsHovered] = React.useState(false);
	return (
		<TooltipBox tooltip={`${movie.title}${movie.release_date ? ` (${(new Date(movie.release_date)).getFullYear()})` : ''}`} side='top'>
			<Card
				ref={ref}
				className={cn(
					"group relative transition flex gap-4 items-center w-32 shrink-0 rounded-md",
					"border-transparent hover:border-accent-yellow",
					"aspect-2/3 overflow-hidden",
					className
				)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				{...props}
			>
				<ImageWithFallback
				src={getTmdbImage({ path: movie.poster_path, size: 'w342' })}
				alt={movie.title ?? ''}
				fill
				className="object-cover"
				type={'movie'}
				unoptimized
				/>
				{(movie.vote_average
				|| profileActivity?.rating
				|| profileActivity?.is_liked
				|| profileActivity?.review
				) ? (
					<div className='absolute top-1 right-1 flex flex-col gap-1'>
						{movie.vote_average ?
						<IconMediaRating
						disableTooltip
						rating={movie.vote_average}
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
						<div className="space-x-2 pointer-events-auto">
							<ButtonUserActivityMovieWatch movieId={movie.id} />
							<ButtonUserWatchlistMovie movieId={movie.id} />
						</div>
					) : null}
					</div>
				) : null}
			</Card>
		</TooltipBox>
	);
});
CardMoviePoster.displayName = "CardMoviePoster";

const CardMovieRow = React.forwardRef<
	HTMLDivElement,
	Omit<CardMovieProps, "variant">
>(({ className, posterClassName, movie, activity, profileActivity, hideMediaType, linked, showRating, children, ...props }, ref) => {
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
				src={getTmdbImage({ path: movie.poster_path, size: 'w342' })}
				alt={movie.title ?? ''}
				fill
				className="object-cover"
				type={'movie'}
				unoptimized
				/>
			</div>
			<div className="flex items-center gap-4 justify-between w-full">
				<div className='space-y-1'>
					<div className="flex items-center gap-2">
						<WithLink
						href={linked ? (movie.url ?? '') : undefined}
						className='line-clamp-2 wrap-break-word'
						onClick={linked ? (e) => e.stopPropagation() : undefined}
						>
							{movie.title}
						</WithLink>
						{profileActivity?.rating && (
							<WithLink
							href={linked ? `/@${profileActivity?.user?.username}/film/${movie.slug ?? movie.id}` : undefined}
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
							href={`/@${profileActivity?.user?.username}/film/${movie.slug ?? movie.id}`}
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
							href={`${movie.url}/review/${profileActivity.review.id}`}
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
					{movie.directors && <Credits credits={movie.directors} linked={linked} className="line-clamp-2"/>}
					{!hideMediaType && <BadgeMedia type={'movie'} />}
				</div>
				{movie.release_date ? (
					<DateOnlyYearTooltip date={movie.release_date} className="text-xs text-muted-foreground"/>
				) : null}
			</div>
		</Card>
	);
});
CardMovieRow.displayName = "CardMovieRow";

const CardMovie = React.forwardRef<
	HTMLDivElement,
	CardMovieProps
>(({ className, movie, hideMediaType = true, onClick, showRating = true, linked = true, variant = "default", ...props }, ref) => {
	const router = useRouter();
	const customOnClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (linked && movie.url) {
			router.push(movie.url);
		}
		onClick && onClick(e);
	};
	return (
	<ContextMenuMovie movie={movie}>
		{variant === "default" ? (
			<CardMovieDefault ref={ref} className={cn(linked ? 'cursor-pointer' : '', className)} movie={movie} linked={linked} onClick={customOnClick} showRating={showRating} {...props} />
		) : variant == "poster" ? (
			<CardMoviePoster ref={ref} className={cn(linked ? 'cursor-pointer' : '', className)} movie={movie} linked={linked} onClick={customOnClick} showRating={showRating} {...props} />
		) : variant == "row" ? (
			<CardMovieRow ref={ref} className={cn(linked ? 'cursor-pointer' : '', className)} movie={movie} linked={linked} onClick={customOnClick} showRating={showRating} hideMediaType={hideMediaType} {...props} />
		) : null}
	</ContextMenuMovie>
	);
});
CardMovie.displayName = "CardMovie";

export {
	type CardMovieProps,
	CardMovie,
	CardMovieDefault,
	CardMoviePoster,
	CardMovieRow,
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