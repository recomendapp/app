'use client'

import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { Link } from "@/lib/i18n/navigation";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { movieCastingOptions } from "@libs/query-client";
import { Movie } from "@packages/api-js";
import { useQuery } from "@tanstack/react-query";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";

export const MovieCasting = ({
	movie,
}: {
	movie: Movie;
}) => {
	const t = useTranslations();

	const {
		data,
		isLoading,
	} = useQuery(movieCastingOptions({
		movieId: movie.id,
	}));

	if (!isLoading && (data !== undefined && data?.length === 0)) {
		return (
			<p className="text-justify text-muted-foreground">
				{upperFirst(t('common.messages.no_cast'))}
			</p>
		)
	}

	return (
		<ScrollArea>
			<div className="flex space-x-4 pb-4">
				{isLoading ? (
					Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-48 w-32 rounded-md" style={{ animationDelay: `${i * 0.12}s` }} />
					))
				) : data?.map(({ person, roles }, i) => (
					<Link key={i} href={person.url ?? ''}>
						<Card className="flex flex-col gap-2 h-full w-32 p-2 hover:bg-muted-hover">
							<div className="relative w-full aspect-3/4 rounded-md overflow-hidden">
							<ImageWithFallback
							src={getTmdbImage({ path: person.profilePath, size: 'w342' })}
							alt={person.name ?? ''}
							fill
							className="object-cover"
							type="person"
							unoptimized
							/>
							</div>
							<div className="text-center">
							<p className="line-clamp-2 wrap-break-word">{person.name}</p>
								{roles && roles.length > 0 ? <p className="line-clamp-2 text-accent-yellow italic text-sm">{roles.map(role => role.character).join(', ')}</p> : null}
							</div>
						</Card>
					</Link>
				))}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	)
};