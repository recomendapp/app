'use client'

import { useMediaTvSeriesCastingOptions } from "@/api/client/options/mediaOptions";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { Link } from "@/lib/i18n/navigation";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { Database } from "@recomendapp/types";
import { useQuery } from "@tanstack/react-query";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";

export const TvSeriesCasting = ({
	tvSeries,
}: {
	tvSeries: Database['public']['Views']['media_tv_series_full']['Row'];
}) => {
	const t = useTranslations();

	const {
		data,
		isLoading,
	} = useQuery(useMediaTvSeriesCastingOptions({
		tvSeriesId: tvSeries.id,
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
				) : data?.map(({ media_person }, i) => (
					media_person && (
						<Link key={i} href={media_person.url ?? ''}>
							<Card className="flex flex-col gap-2 h-full w-32 p-2 hover:bg-muted-hover">
								<div className="relative w-full aspect-3/4 rounded-md overflow-hidden">
								<ImageWithFallback
								src={getTmdbImage({ path: media_person.profile_path, size: 'w342' })}
								alt={media_person.name ?? ''}
								fill
								className="object-cover"
								type="person"
								unoptimized
								/>
								</div>
								<div className="text-center">
								<p className="line-clamp-2 wrap-break-word">{media_person.name}</p>
								{/* {characters ? <p className="line-clamp-2 text-accent-yellow italic text-sm">{characters.join(', ')}</p> : null} */}
								</div>
							</Card>
						</Link>
					)
				))}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	)
};