'use client'

import { useMediaTvSeriesSeasonsOptions } from "@/api/client/options/mediaOptions";
import { IconMediaRating } from "@/components/Media/icons/IconMediaRating";
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
import { cn } from '@/lib/utils';

export const TvSeriesSeasons = ({
	tvSeries,
}: {
	tvSeries: Database['public']['Views']['media_tv_series_full']['Row'];
}) => {
	const t = useTranslations();

	const {
		data,
		isLoading,
	} = useQuery(useMediaTvSeriesSeasonsOptions({
		tvSeriesId: tvSeries.id,
	}));

	return (
		<ScrollArea>
			<div className="flex space-x-4 pb-4">
				{isLoading ? (
					Array.from({ length: tvSeries.number_of_seasons || 5 }).map((_, i) => (
						<Skeleton key={i} className="w-32 aspect-2/3 rounded-md" style={{ animationDelay: `${i * 0.12}s` }} />
					))
				) : data?.map((season, i) => (
					<Link key={i} href={`/tv-series/${tvSeries.slug || tvSeries.id}/${season.season_number}`}>
						<Card className={cn("flex flex-col gap-2 h-full w-32 p-2 hover:bg-muted-hover", season.season_number === 0 ? 'opacity-70' : '')}>
							<div className="relative w-full aspect-3/4 rounded-md overflow-hidden">
								<ImageWithFallback
								src={getTmdbImage({ path: season.poster_path, size: 'w342' })}
								alt={upperFirst(t('common.messages.tv_season_value', { number: season.season_number! }))}
								fill
								className="object-cover"
								type="tv_season"
								unoptimized
								/>
								<div className='absolute flex flex-col gap-2 top-2 right-2 w-12'>
								{season.vote_count ? <IconMediaRating
									rating={season.vote_average}
									variant="general"
									className="w-full"
								/> : null}
								</div>
							</div>
							<div className="text-center">
								<p className="line-clamp-2 wrap-break-word">
									{season.season_number !== 0 ? upperFirst(t('common.messages.tv_season_value', { number: season.season_number! })) : upperFirst(t('common.messages.tv_special_episode', { count: 2 }))}
								</p>
								<p className="text-sm text-muted-foreground">{upperFirst(t('common.messages.tv_episode_count', { count: season.episode_count! }))}</p>
							</div>
						</Card>
					</Link>
				))}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	)
};