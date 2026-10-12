'use server';

import { getAnonApi } from '@/lib/api/server';
import { cache } from '@/lib/utils/cache';
import { SupportedLocale } from '@libs/i18n';
import {
  movieMetadataControllerGet,
  tvSeriesMetadataControllerGet,
  personMetadataControllerGet,
  moviesControllerGet,
  personMoviesControllerFacets,
  personsControllerGet,
  tvSeasonsControllerGet,
  tvSeriesControllerGet,
  personTvSeriesControllerFacets,
  PersonMoviesControllerListPaginatedData,
  personMoviesControllerListPaginated,
  PersonTvSeriesControllerListPaginatedData,
  personTvSeriesControllerListPaginated,
} from '@libs/api-js';
import { notFound } from 'next/navigation';

const MEDIA_REVALIDATE_TIME = 60 * 60 * 24; // 24 hours

export const getMovie = cache(
  async (locale: SupportedLocale, id: number) => {
    const client = await getAnonApi({
      locale,
    });
    return await moviesControllerGet({
      path: {
        movie_id: id,
      },
      client,
    });
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);

export const getTvSeries = cache(
  async (locale: SupportedLocale, id: number) => {
    const client = await getAnonApi({
      locale,
    });
    return await tvSeriesControllerGet({
      path: {
        tv_series_id: id,
      },
      client,
    });
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);

export const getTvSeason = cache(
  async (locale: SupportedLocale, serieId: number, seasonNumber: number) => {
    const client = await getAnonApi({
      locale,
    });
    return await tvSeasonsControllerGet({
      path: {
        tv_series_id: serieId,
        season_number: seasonNumber,
      },
      client,
    });
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);

export const getPerson = cache(
  async (locale: SupportedLocale, id: number) => {
    const client = await getAnonApi({
      locale,
    });
    const { data, error } = await personsControllerGet({
      path: {
        person_id: id,
      },
      client,
    });
    if (error) notFound();
    if (!data) notFound();
    return data;
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);

export const getPersonFilms = cache(
  async (
    personId: number,
    filters: NonNullable<PersonMoviesControllerListPaginatedData['query']>,
  ) => {
    const client = await getAnonApi();
    const { data, error } = await personMoviesControllerListPaginated({
      path: {
        person_id: personId,
      },
      query: filters,
      client,
    });
    if (error) throw error;
    if (data === undefined) throw new Error('No data');
    return data;
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);
export const getPersonFilmsFacets = cache(
  async (personId: number) => {
    const client = await getAnonApi();
    const { data, error } = await personMoviesControllerFacets({
      path: {
        person_id: personId,
      },
      client,
    });
    if (error) throw error;
    if (!data) notFound();
    return data;
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);

export const getPersonTvSeries = cache(
  async (
    personId: number,
    filters: NonNullable<PersonTvSeriesControllerListPaginatedData['query']>,
  ) => {
    const client = await getAnonApi();
    const { data, error } = await personTvSeriesControllerListPaginated({
      path: {
        person_id: personId,
      },
      query: filters,
      client,
    });
    if (error) throw error;
    if (data === undefined) throw new Error('No data');
    return data;
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);
export const getPersonTvSeriesFacets = cache(
  async (personId: number) => {
    const client = await getAnonApi();
    const { data, error } = await personTvSeriesControllerFacets({
      path: {
        person_id: personId,
      },
      client,
    });
    if (error) throw error;
    if (!data) notFound();
    return data;
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);

/* ------------------------------- METADATA -------------------------------- */
/*
 * Which locales genuinely translate an entity, for the page's hreflang set.
 *
 * No `locale` parameter on purpose: the endpoint answers for every locale at once, so a
 * single cache entry serves all of them rather than one per language.
 *
 * Failures resolve to `undefined` instead of throwing. An hreflang set is an
 * enhancement; losing it must never turn a film page into a 500.
 */

export const getMovieMetadata = cache(
  async (id: number) => {
    const client = await getAnonApi();
    const { data } = await movieMetadataControllerGet({
      path: {
        movie_id: id,
      },
      client,
    });
    return data;
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);

export const getTvSeriesMetadata = cache(
  async (id: number) => {
    const client = await getAnonApi();
    const { data } = await tvSeriesMetadataControllerGet({
      path: {
        tv_series_id: id,
      },
      client,
    });
    return data;
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);

export const getPersonMetadata = cache(
  async (id: number) => {
    const client = await getAnonApi();
    const { data } = await personMetadataControllerGet({
      path: {
        person_id: id,
      },
      client,
    });
    return data;
  },
  {
    revalidate: MEDIA_REVALIDATE_TIME,
  },
);
