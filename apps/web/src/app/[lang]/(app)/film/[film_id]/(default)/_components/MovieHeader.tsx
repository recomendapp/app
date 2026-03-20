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
import { RuntimeTooltip } from '@/components/utils/RuntimeTooltip';
import { cn } from '@/lib/utils';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { useLocale, useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { IconMediaRating } from '@/components/Media/icons/IconMediaRating';
import { TMDB_IMAGE_BASE_URL } from '@/lib/tmdb/tmdb';
import ButtonUserWatchlistMovie from '@/components/buttons/ButtonUserWatchlistMovie';
import ButtonLogMovieLike from '@/components/buttons/ButtonLogMovieLike';
import ButtonLogMovieRating from '@/components/buttons/ButtonLogMovieRating';
import ButtonLogMovieWatch from '@/components/buttons/ButtonLogMovieWatch';
import ButtonLogMovieWatchedDate from '@/components/buttons/ButtonLogMovieWatchedDate';
import { ContextMenuMovie } from '@/components/ContextMenu/ContextMenuMovie';
import ButtonPlaylistAdd from '@/components/buttons/ButtonPlaylistAdd';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import ButtonFollowersAvgRatingMovie from '@/components/buttons/ButtonFollowersAvgRatingMovie';
import { Genre, Movie, MovieTrailer } from '@packages/api-js';
import ButtonUserRecoSend from '@/components/buttons/ButtonUserRecoSend';

export const MovieHeader = ({
  movie,
}: {
  movie: Movie;
}) => {
  const t = useTranslations();
  return (
    <div>
      <ContextMenuMovie movie={movie}>
        <HeaderBox background={movie.backdropPath ? { src: `${TMDB_IMAGE_BASE_URL}/w1280${movie.backdropPath}`, alt: movie.title ?? '', unoptimized: true } : undefined}>
          <div className="max-w-7xl flex flex-col w-full gap-4 items-center @xl/header-box:flex-row">
            {/* MOVIE POSTER */}
            <MediaPoster
              className="w-[200px]"
              src={getTmdbImage({ path: movie.posterPath, size: 'w1280' })}
              alt={movie.title ?? ''}
              fill
              unoptimized
            >
              <div className='absolute flex flex-col gap-2 top-2 right-2 w-12'>
                {movie.voteAverage ? <IconMediaRating
                  rating={movie.voteAverage}
                  variant="general"
                  className="w-full"
                /> : null}
                <ButtonFollowersAvgRatingMovie movieId={movie.id} />
              </div>
              {(movie.trailers && movie.trailers.length > 0) ? (
                <MovieTrailerButton
                videos={movie.trailers}
                className="absolute bottom-2 right-2"
                />
              ) : null}
            </MediaPoster>
            {/* MOVIE MAIN DATA */}
            <div className="flex flex-col justify-between gap-2 w-full h-full py-4">
              {/* TYPE & GENRES */}
              <div>
                <span className='text-accent-yellow'>{upperFirst(t('common.messages.film', { count: 1 }))}</span>
                {movie.genres ? <Genres genres={movie.genres} className="before:content-['_|_']" /> : null}
              </div>
              {/* TITLE */}
              <h1 className="text-clamp space-x-1">
                <span className='font-bold select-text'>{movie.title}</span>
                {/* DATE */}
                {movie.releaseDate && (
                  <sup>
                    <DateOnlyYearTooltip date={movie.releaseDate} className=' text-base font-medium'/>
                  </sup>
                )}
                {movie.originalTitle !== movie.title ? <div className='text-base font-semibold text-muted-foreground'>{movie.originalTitle}</div> : null}
              </h1>
              <div className=" space-y-2">
                <div>
                  {movie.directors?.map((director, index: number) => (
                    <Fragment key={index}>
                      {index > 0 && <span>, </span>}
                      <span key={index}>
                        <Button
                          variant="link"
                          className="w-fit p-0 h-full"
                          asChild
                        >
                          <Link href={`/person/${director?.slug ?? director?.id}`}>{director.name}</Link>
                        </Button>
                      </span>
                    </Fragment>
                  )) ?? <span className="text-muted-foreground italic">{upperFirst(t('common.messages.unknown'))}</span>}
                  {/* RUNTIME */}
                  <RuntimeTooltip runtime={movie.runtime ?? 0} className=" before:content-['_•_']" />
                </div>
              </div>
            </div>
          </div>
        </HeaderBox>
      </ContextMenuMovie>
      <div className='flex flex-col items-center'>
        <div className="max-w-7xl w-full flex justify-between gap-2 px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto items-center">
            <ButtonLogMovieRating movieId={movie.id} />
            <ButtonLogMovieLike movieId={movie.id} />
            <ButtonLogMovieWatch movieId={movie.id} />
            <ButtonUserWatchlistMovie movieId={movie.id} />
            <ButtonLogMovieWatchedDate movieId={movie.id} />
          </div>
          <div className="flex gap-2 items-center">
            <ButtonPlaylistAdd mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
            <ButtonUserRecoSend mediaId={movie.id} mediaType="movie" mediaTitle={movie.title} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const MovieTrailerButton = ({
  videos,
  className,
} : {
  videos: MovieTrailer[];
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
      <DialogContent className="@xl/header-box:max-w-[60vw]">
        <DialogHeader className="relative flex flex-row gap-4 items-center">
          <DialogTitle className="absolute left-1/2 transform -translate-x-1/2 -top-12 @xl/header-box:-top-16 text-accent-yellow-foreground text-2xl @xl/header-box:text-5xl font-bold rounded-md bg-accent-yellow px-4 py-2 pointer-events-auto">
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
  genres: Genre[];
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