'use client'

import { HeaderBox } from '@/components/Box/HeaderBox';
import PersonPoster from './PersonPoster';
import { PersonFollowButton } from './PersonFollowButton';
import { PersonAbout } from './PersonAbout';
import { Database } from '@recomendapp/types';
import { useQuery } from '@tanstack/react-query';
import { useMediaPersonFilmsOptions } from '@/api/client/options/mediaOptions';
import { DEFAULT_PER_PAGE, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER } from '../films/_components/constants';
import { useRandomImage } from '@/hooks/use-random-image';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';

export const PersonHeader = ({
  person,
} : {
  person: Database['public']['Views']['media_person']['Row'];
}) => {
  const {
    data
  } = useQuery(useMediaPersonFilmsOptions({
    personId: person.id,
    filters: {
      page: 1,
      perPage: DEFAULT_PER_PAGE,
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER,
    }
  }));
  const randomBg = useRandomImage(data?.map(({ media_movie}) => ({
      src: media_movie.backdrop_path ?? '',
      alt: media_movie.title ?? `${person.slug}-backdrop`,
  })) ?? []);
  return (
    <HeaderBox background={randomBg ? { src: getTmdbImage({ path: randomBg.src, size: 'w1280' }), alt: randomBg.alt || `${person.slug}-backdrop`, unoptimized: true } : undefined}>
      <div className="max-w-7xl flex flex-col w-full gap-4 items-center @2xl/header-box:flex-row">
        {/* MOVIE POSTER */}
        <PersonPoster
          className="w-[280px]"
          poster_path={person.profile_path ?? ''}
          alt={person.name ?? ''}
        />
        {/* MOVIE MAIN DATA */}
        <div className="flex flex-col justify-between gap-2 w-full h-full py-4">
          {/* TYPE */}
          <div>
            <span className='text-accent-yellow'>Personnalité</span>
            <span className=" before:content-['_|_']">
              {person.known_for_department}
            </span>
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
