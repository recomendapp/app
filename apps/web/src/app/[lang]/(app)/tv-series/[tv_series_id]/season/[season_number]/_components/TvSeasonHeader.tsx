'use client'

import MediaPoster from '@/components/Media/MediaPoster';
import { HeaderBox } from '@/components/Box/HeaderBox';
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import { IconMediaRating } from '@/components/Media/icons/IconMediaRating';
import { useRandomImage } from '@/hooks/use-random-image';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/navigation';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { useQuery } from '@tanstack/react-query';
import { TvSeasonGet } from '@packages/api-js';
import { tvSeasonEpisodesOptions } from '@libs/query-client';

export const TvSeasonHeader = ({
	season,
}: {
	season: TvSeasonGet
}) => {
	const t = useTranslations();
	const title = upperFirst(t('common.messages.tv_season_value', { number: season.seasonNumber }));
	const {
		data: episodes,
	} = useQuery(tvSeasonEpisodesOptions({
		tvSeriesId: season.tvSeriesId,
		seasonNumber: season.seasonNumber,
	}));
	const randomBg = useRandomImage(episodes?.map(episode => ({
		src: episode.stillPath ?? '',
		alt: upperFirst(t('common.messages.tv_episode_value', { number: episode.episodeNumber })),
	})) ?? []);
	return (
	<HeaderBox className='@xl/header-box:h-fit' background={randomBg ? { src: getTmdbImage({ path: randomBg.src, size: 'w1280' }), alt: randomBg.alt ?? '', unoptimized: true } : undefined}>
		<div className="w-full max-w-7xl flex flex-row gap-4 items-center">
			<MediaPoster
			className="w-20 @md/header-box:w-[100px] @lg/header-box:w-[120px] @xl/header-box:w-[150px]"
			src={getTmdbImage({ path: season.posterPath, size: 'w1280' })}
			alt={title}
			fill
			unoptimized
			>
				<div className='absolute flex flex-col gap-2 top-2 right-2 w-12'>
					{season.voteAverage ? <IconMediaRating
						rating={season.voteAverage}
						variant="general"
						className="w-full"
					/> : null}
				</div>
			</MediaPoster>
			<div className="flex flex-col justify-between gap-2 w-full h-full py-4">
				<div>
					<span className='text-accent-yellow'>{upperFirst(t('common.messages.tv_season', { count: 1 }))}</span>
					{season.tvSeries && <span className="before:content-['_|_']">
						<Button variant={'link'} className=" w-fit p-0 font-normal" asChild>
							<Link href={`/tv-series/${season.tvSeries.slug || season.tvSeries.id}`}>
							{season.tvSeries.name}
							</Link>
						</Button>
					</span>}
				</div>
				<h1 className="text-clamp space-x-1">
					<span className='font-bold select-text'>{title}</span>
					{season.name && (
						<div className='text-base font-semibold text-muted-foreground'>{season.name}</div>
					)}
				</h1>
				<div>
					{t('common.messages.tv_episode_count', { count: season.episodeCount })}
				</div>
			</div>
		</div>
	</HeaderBox>
  );
}