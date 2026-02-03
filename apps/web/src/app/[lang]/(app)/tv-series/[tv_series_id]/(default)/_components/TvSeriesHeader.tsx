'use client'

import { Fragment, useState } from 'react';
import { Link } from "@/lib/i18n/navigation";
import YoutubeEmbed from '@/components/utils/Youtube';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play } from 'lucide-react';
import { DateOnlyYearTooltip } from '@/components/utils/Date';
import MediaPoster from '@/components/Media/MediaPoster';
import { HeaderBox } from '@/components/Box/HeaderBox';
import { cn } from '@/lib/utils';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { Database } from '@recomendapp/types';
import { upperFirst } from 'lodash';
import { useLocale, useTranslations } from 'next-intl';
import { IconMediaRating } from '@/components/Media/icons/IconMediaRating';
import ButtonUserWatchlistTvSeries from '@/components/buttons/ButtonUserWatchlistTvSeries';
import ButtonUserActivityTvSeriesLike from '@/components/buttons/ButtonUserActivityTvSeriesLike';
import ButtonUserActivityTvSeriesRating from '@/components/buttons/ButtonUserActivityTvSeriesRating';
import ButtonUserActivityTvSeriesWatch from '@/components/buttons/ButtonUserActivityTvSeriesWatch';
import ButtonUserActivityTvSeriesWatchedDate from '@/components/buttons/ButtonUserActivityTvSeriesWatchedDate';
import { ContextMenuTvSeries } from '@/components/ContextMenu/ContextMenuTvSeries';
import ButtonUserRecosTvSeriesSend from '@/components/buttons/ButtonUserRecosTvSeriesSend';
import ButtonPlaylistTvSeriesAdd from '@/components/buttons/ButtonPlaylistTvSeriesAdd';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import ButtonFollowersAvgRatingTvSeries from '@/components/buttons/ButtonFollowersAvgRatingTvSeries';

export const TvSeriesHeader = ({
  tvSeries,
}: {
  tvSeries: Database['public']['Views']['media_tv_series_full']['Row'];
}) => {
  const t = useTranslations();
  return (
    <div>
      <ContextMenuTvSeries tvSeries={tvSeries}>
        <HeaderBox background={tvSeries.backdrop_path ? { src: getTmdbImage({ path: tvSeries.backdrop_path, size: 'w1280' }), alt: tvSeries.name ?? '', unoptimized: true } : undefined}>
          <div className="max-w-7xl flex flex-col w-full gap-4 items-center @xl/header-box:flex-row">
            <MediaPoster
              className="w-[200px]"
              src={getTmdbImage({ path: tvSeries?.poster_path, size: 'w1280' })}
              alt={tvSeries.name ?? ''}
              fill
              unoptimized
            >
                <div className='absolute flex flex-col gap-2 top-2 right-2 w-12'>
                  {tvSeries.vote_average ? <IconMediaRating
                    rating={tvSeries.vote_average}
                    variant="general"
                    className="w-full"
                  /> : null}
                  <ButtonFollowersAvgRatingTvSeries tvSeriesId={tvSeries.id} />
                </div>
              {(tvSeries?.trailers && tvSeries.trailers.length > 0) ? (
                <SerieTrailerButton
                  videos={tvSeries.trailers}
                  className="absolute bottom-2 right-2"
                />
              ) : null}
            </MediaPoster>
            {/* MOVIE MAIN DATA */}
            <div className="flex flex-col justify-between gap-2 w-full h-full py-4">
              {/* TYPE & GENRES */}
              <div>
                <span className='text-accent-yellow'>{upperFirst(t('common.messages.tv_series', { count: 1 }))}</span>
                {tvSeries.genres ? <Genres genres={tvSeries.genres} className="before:content-['_|_']" /> : null}
              </div>
              {/* TITLE */}
              <h1 className="text-clamp space-x-1">
                <span className='font-bold select-text'>{tvSeries.name}</span>
                {/* DATE */}
                <sup>
                  <DateOnlyYearTooltip date={tvSeries.first_air_date ?? ''} className=' text-base font-medium'/>
                </sup>
                {tvSeries.original_name !== tvSeries.name && (
                  <div className='text-base font-semibold text-muted-foreground'>{tvSeries.original_name}</div>
                )}
              </h1>
              <div className=" space-y-2">
                <div>
                  {tvSeries.created_by?.map((director, index: number) => (
                    <Fragment key={index}>
                      {index > 0 && <span>, </span>}
                      <span key={index}>
                        <Button
                          variant="link"
                          className="w-fit p-0 h-full"
                          asChild
                        >
                          <Link href={director.url ?? ''}>{director?.name}</Link>
                        </Button>
                      </span>
                    </Fragment>
                  )) ?? <span className="text-muted-foreground italic">{upperFirst(t('common.messages.unknown'))}</span>}
                  <span className="before:content-['_•_']">
                    {t('common.messages.tv_season_count', { count: tvSeries.number_of_seasons! })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </HeaderBox>
      </ContextMenuTvSeries>
      <div className='flex flex-col items-center'>
        <div className="max-w-7xl w-full flex justify-between gap-2 px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto items-center">
            <ButtonUserActivityTvSeriesRating tvSeriesId={tvSeries.id} />
            <ButtonUserActivityTvSeriesLike tvSeriesId={tvSeries.id} />
            <ButtonUserActivityTvSeriesWatch tvSeriesId={tvSeries.id} />
            <ButtonUserWatchlistTvSeries tvSeriesId={tvSeries.id} />
            <ButtonUserActivityTvSeriesWatchedDate tvSeriesId={tvSeries.id} />
          </div>
          <div className="flex gap-2 items-center">
            <ButtonPlaylistTvSeriesAdd tvSeriesId={tvSeries.id} tvSeriesTitle={tvSeries.name} />
            <ButtonUserRecosTvSeriesSend tvSeriesId={tvSeries.id} tvSeriesTitle={tvSeries.name} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const SerieTrailerButton = ({
  videos,
  className,
} : {
  videos: Database['public']['Tables']['tmdb_tv_series_videos']['Row'][];
  className?: string;
}) => {
  const [selectedTrailer, setSelectedTailer] = useState<string>(
    videos[0].key ?? ''
  );

  if (!videos?.length) return null;

  return (
    <Dialog>
      <TooltipBox tooltip={videos.length > 1 ? 'Voir les trailers' : 'Voir le trailer'}>
        <DialogTrigger asChild>
          <Button variant={'default'} className={cn("p-1.5 w-6 h-6 shrink-0 bg-foreground rounded-full", className)}>
            <Play
              size="icon"
              className="text-background fill-background"
            />
          </Button>
        </DialogTrigger>
      </TooltipBox>
      <DialogContent className="@xl/movie-header:max-w-[60vw]">
        <DialogHeader className="relative flex flex-row gap-4 items-center">
          <DialogTitle className="absolute left-1/2 transform -translate-x-1/2 -top-12 @xl/movie-header:-top-16 text-accent-yellow-foreground text-2xl @xl/movie-header:text-5xl font-bold rounded-md bg-accent-yellow px-4 py-2 pointer-events-auto">
            TRAILER
          </DialogTitle>
          <div className=" pt-4">
            <Select
              onValueChange={setSelectedTailer}
              defaultValue={selectedTrailer}
            >
              <SelectTrigger className="w-fit">
                <SelectValue placeholder="Langue" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {videos?.map((video: any) => (
                    <SelectItem key={video.key} value={video.key}>
                      {video.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>
        <YoutubeEmbed embedId={selectedTrailer} className="aspect-video" />
      </DialogContent>
    </Dialog>
  );
}

const Genres = ({
  genres,
  className,
} : {
  genres: {
    id: number;
    name: string;
  }[];
  className?: string;
}) => {
  const locale = useLocale();
  const formattedGenres = new Intl.ListFormat(locale, {
    style: 'narrow',
    type: 'conjunction',
  }).formatToParts(genres.map((genre) => genre.name));

  return (
    <span className={cn("", className)}>
      {formattedGenres.map((part, index) => {
        if (part.type === 'element') {
          const genre = genres.find((g) => g.name === part.value);
          return (
            <Button
              key={index}
              variant="link"
              className="w-fit p-0 h-full font-normal"
              asChild
            >
              <Link href={`/genre/${genre?.id}`}>{part.value}</Link>
            </Button>
          );
        }
        return part.value;
      })}
    </span>
  );
}