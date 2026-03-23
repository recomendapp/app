'use client'

import * as React from "react"
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { ImageWithFallback } from "../utils/ImageWithFallback";
import { useRouter } from "@/lib/i18n/navigation";
import { WithLink } from "../utils/WithLink";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { PersonCompact } from "@packages/api-js";

interface CardPersonProps
	extends React.ComponentProps<typeof Card> {
		variant?: "default" | "poster" | "row";
		person: PersonCompact;
		linked?: boolean;
		posterClassName?: string;
		disableActions?: boolean;
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
					src={getTmdbImage({ path: person.profilePath, size: 'w342' })}
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
>(({ className, posterClassName, person, linked, children, ...props }, ref) => {
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
				src={getTmdbImage({ path: person.profilePath, size: 'w342' })}
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
					{/* {person.known_for_department && (
						<div className="text-xs text-muted-foreground">
							{person.known_for_department}
						</div>
					)} */}
				</div>
			</div>
		</Card>
	);
});
CardPersonRow.displayName = "CardPersonRow";

const CardPerson = React.forwardRef<
	HTMLDivElement,
	CardPersonProps
>(({ className, onClick, linked = true, variant = "default", ...props }, ref) => {
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
			<CardPersonRow ref={ref} className={cn(linked ? 'cursor-pointer' : '', className)} linked={linked} onClick={customOnClick} {...props} />
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
