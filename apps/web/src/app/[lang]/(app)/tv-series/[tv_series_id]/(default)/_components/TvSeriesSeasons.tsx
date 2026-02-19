'use client'

import { IconMediaRating } from "@/components/Media/icons/IconMediaRating";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/utils/ImageWithFallback";
import { Link } from "@/lib/i18n/navigation";
import { getTmdbImage } from "@/lib/tmdb/getTmdbImage";
import { useQuery } from "@tanstack/react-query";
import { upperFirst } from "lodash";
import { useTranslations } from "next-intl";
import { cn } from '@/lib/utils';
import { TvSeries } from "@packages/api-js";
import { tvSeriesSeasonsOptions } from "@libs/query-client";

export const TvSeriesSeasons = ({
	tvSeries,
}: {
	tvSeries: TvSeries;
}) => {
	const t = useTranslations();

	const {
		data,
		isLoading,
	} = useQuery(tvSeriesSeasonsOptions({
		tvSeriesId: tvSeries.id,
	}));

	return (
		<ScrollArea>
			<div className="flex space-x-4 pb-4">
				{isLoading ? (
					Array.from({ length: tvSeries.numberOfSeasons || 5 }).map((_, i) => (
						<Skeleton key={i} className="w-32 aspect-2/3 rounded-md" style={{ animationDelay: `${i * 0.12}s` }} />
					))
				) : data?.map((season, i) => (
					<Link key={i} href={`/tv-series/${tvSeries.slug || tvSeries.id}/season/${season.seasonNumber}`}>
						<Card className={cn("flex flex-col gap-2 h-full w-32 p-2 hover:bg-muted-hover", season.seasonNumber === 0 ? 'opacity-70' : '')}>
							<div className="relative w-full aspect-3/4 rounded-md overflow-hidden">
								<ImageWithFallback
								src={getTmdbImage({ path: season.posterPath, size: 'w342' })}
								alt={upperFirst(t('common.messages.tv_season_value', { number: season.seasonNumber! }))}
								fill
								className="object-cover"
								type="tv_season"
								unoptimized
								/>
								<div className='absolute flex flex-col gap-2 top-2 right-2 w-12'>
								{season.voteCount ? <IconMediaRating
									rating={season.voteAverage}
									variant="general"
									className="w-full"
								/> : null}
								</div>
							</div>
							<div className="text-center">
								<p className="line-clamp-2 wrap-break-word">
									{season.seasonNumber !== 0 ? upperFirst(t('common.messages.tv_season_value', { number: season.seasonNumber })) : upperFirst(t('common.messages.tv_special_episode', { count: 2 }))}
								</p>
								<p className="text-sm text-muted-foreground">{upperFirst(t('common.messages.tv_episode_count', { count: season.episodeCount }))}</p>
							</div>
						</Card>
					</Link>
				))}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	)
};