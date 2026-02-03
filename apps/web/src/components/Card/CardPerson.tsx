'use client'

import * as React from "react"
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { MediaPerson } from "@recomendapp/types";
import { ImageWithFallback } from "../utils/ImageWithFallback";
import { useRouter } from "@/lib/i18n/navigation";
import { Button } from "../ui/button";
import { BadgeMedia } from "../Badge/BadgeMedia";
import { WithLink } from "../utils/WithLink";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";

interface CardPersonProps
	extends React.ComponentProps<typeof Card> {
		variant?: "default" | "poster" | "row";
		person: MediaPerson;
		linked?: boolean;
		posterClassName?: string;
		disableActions?: boolean;
		hideMediaType?: boolean;
	}

const CardPersonDefault = React.forwardRef<
	HTMLDivElement,
	Omit<CardPersonProps, "variant">
>(({ className, person, children, linked, posterClassName, ...props }, ref) => {
	return (
	<WithLink href={person.url ?? undefined}>
		<Card
			ref={ref}
			className={cn(
				"flex-row gap-2 items-center rounded-xl h-20 bg-muted hover:bg-muted-hover p-1",
				className
			)}
			{...props}
		>
			<div
			className={cn('relative h-full shrink-0 overflow-hidden aspect-square rounded-full', posterClassName)}
			>
				<ImageWithFallback
					src={getTmdbImage({ path: person.profile_path, size: 'w342' })}
					alt={person.name ?? ''}
					fill
					className="object-cover"
					type="person"
					unoptimized
				/>
			</div>
			<div className='px-2 py-1 space-y-1'>
				<p className='line-clamp-2 wrap-break-word'>{person.name}</p>
				{children}
			</div>
		</Card>
	</WithLink>
	);
});
CardPersonDefault.displayName = "CardPersonDefault";

const CardPersonRow = React.forwardRef<
	HTMLDivElement,
	Omit<CardPersonProps, "variant">
>(({ className, posterClassName, person, hideMediaType, linked, children, ...props }, ref) => {
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
				src={getTmdbImage({ path: person.profile_path, size: 'w342' })}
				alt={person.name ?? ''}
				fill
				className="object-cover"
				type={'person'}
				unoptimized
				/>
			</div>
			<div className="flex items-center gap-4 justify-between w-full">
				<div className='space-y-1'>
					<div className="flex items-center gap-2">
						<WithLink
						href={linked ? (person.url ?? '') : undefined}
						className='line-clamp-2 wrap-break-word'
						onClick={linked ? (e) => e.stopPropagation() : undefined}
						>
							{person.name}
						</WithLink>
					</div>
					{person.known_for_department && (
						<div className="text-xs text-muted-foreground">
							{person.known_for_department}
						</div>
					)}
					{!hideMediaType && <BadgeMedia type={'person'} />}
				</div>
			</div>
		</Card>
	);
});
CardPersonRow.displayName = "CardPersonRow";

const CardPerson = React.forwardRef<
	HTMLDivElement,
	CardPersonProps
>(({ className, hideMediaType = true, onClick, linked = true, variant = "default", ...props }, ref) => {
	const router = useRouter();
	const customOnClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (linked && props.person.url) {
			router.push(props.person.url);
		}
		onClick && onClick(e);
	};
	return (
	<>
		{variant === "default" ? (
			<CardPersonDefault ref={ref} className={cn(linked ? 'cursor-pointer' : '', className)} linked={linked} onClick={customOnClick} {...props} />
		) : variant == "row" ? (
			<CardPersonRow ref={ref} className={cn(linked ? 'cursor-pointer' : '', className)} linked={linked} onClick={customOnClick} hideMediaType={hideMediaType} {...props} />
		) : null}
	</>
	);
});
CardPerson.displayName = "CardPerson";

export {
	type CardPersonProps,
	CardPerson,
	CardPersonDefault,
	CardPersonRow,
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