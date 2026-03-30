'use client'

import { HeaderBox } from '@/components/Box/HeaderBox';
import PersonPoster from './PersonPoster';
import { PersonFollowButton } from './PersonFollowButton';
import { PersonAbout } from './PersonAbout';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRandomImage } from '@/hooks/use-random-image';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { Person } from '@packages/api-js';
import { personMoviesInfiniteOptions, personTvSeriesInfiniteOptions } from '@libs/query-client/src';

export const PersonHeader = ({
  person,
} : {
  person: Person;
}) => {
  const { data: movies } = useInfiniteQuery(personMoviesInfiniteOptions({ personId: person.id }));
  const { data: tvSeries } = useInfiniteQuery(personTvSeriesInfiniteOptions({ personId: person.id }));

  const randomBg = useRandomImage([
    ...(movies?.pages.flatMap(page => page.data.map(({ movie }) => ({
      src: movie.backdropPath ?? '',
      alt: movie.title ?? `${person.slug}-backdrop`,
    }))) ?? []),
    ...(tvSeries?.pages.flatMap(page => page.data.map(({ tvSeries }) => ({
      src: tvSeries.backdropPath ?? '',
      alt: tvSeries.name ?? `${person.slug}-backdrop`,
    }))) ?? []),
  ]);
  return (
    <HeaderBox background={randomBg ? { src: getTmdbImage({ path: randomBg.src, size: 'w1280' }), alt: randomBg.alt || `${person.slug}-backdrop`, unoptimized: true } : undefined}>
      <div className="max-w-7xl flex flex-col w-full gap-4 items-center @2xl/header-box:flex-row">
        {/* MOVIE POSTER */}
        <PersonPoster
        className="w-[280px]"
        poster_path={person.profilePath ?? ''}
        alt={person.name ?? ''}
        />
        {/* MOVIE MAIN DATA */}
        <div className="flex flex-col justify-between gap-2 w-full h-full py-4">
          {/* TYPE */}
          <div>
            <span className='text-accent-yellow'>Personnalité</span>
            {person.knownForDepartment && (
              <span className=" before:content-['_|_']">
                {person.knownForDepartment}
              </span>
            )}
          </div>
          {/* NAME */}
          <div className="text-xl select-text @xl/header-box:text-6xl font-bold line-clamp-2">
            {person.name}
          </div>
          <div className='space-y-2'>
            <PersonAbout person={person} />
            <PersonFollowButton personId={person.id} />
          </div>
        </div>
      </div>
    </HeaderBox>
  );
}
