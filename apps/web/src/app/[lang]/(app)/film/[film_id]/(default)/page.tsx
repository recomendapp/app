import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { truncate, upperFirst } from 'lodash';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { siteConfig } from '@/config/site';
import { Metadata } from 'next';
import { generateAlternates } from '@/lib/i18n/routing';
import { Movie, WithContext } from 'schema-dts';
import { toISO8601Duration } from '@/lib/utils';
import { SupportedLocale } from '@/translations/locales';
import { getMovie } from '@/api/server/medias';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { Database } from '@recomendapp/types';
import { JustWatchWidget } from '@/components/JustWatch/JustWatchWidgetScript';
import { MovieCasting } from './_components/MovieCasting';

export async function generateMetadata(
  props: {
      params: Promise<{
        lang: string;
        film_id: string;
      }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  const { id: movieId} = getIdFromSlug(params.film_id);
  try {
    const movie = await getMovie(params.lang, movieId);
    return {
      title: t('pages.film.metadata.title', { title: movie.title!, year: new Date(String(movie.release_date)).getFullYear() }),
      description: truncate(
        movie.directors
          ? t('pages.film.metadata.description', {
            title: movie.title!,
            directors: new Intl.ListFormat(params.lang, { style: 'long', type: 'conjunction' }).format(movie.directors.map((director) => director.name ?? '')),
            year: new Date(String(movie.release_date)).getFullYear(),
            overview: movie.overview || '',
          }) : t('pages.film.metadata.description_no_director', {
            title: movie.title!,
            year: new Date(String(movie.release_date)).getFullYear(),
            overview: movie.overview || ''
          }),
        { length: siteConfig.seo.description.limit }
      ),
      alternates: generateAlternates(params.lang, `/film/${movie.slug}`),
      openGraph: {
        siteName: siteConfig.name,
        title: `${t('pages.film.metadata.title', { title: movie.title!, year: new Date(String(movie.release_date)).getFullYear() })} • ${siteConfig.name}`,
        description: truncate(
          movie.directors
            ? t('pages.film.metadata.description', {
              title: movie.title!,
              directors: new Intl.ListFormat(params.lang, { style: 'long', type: 'conjunction' }).format(movie.directors.map((director) => director.name ?? '')),
              year: new Date(String(movie.release_date)).getFullYear(),
              overview: movie.overview || '',
            }) : t('pages.film.metadata.description_no_director', {
              title: movie.title!,
              year: new Date(String(movie.release_date)).getFullYear(),
              overview: movie.overview || ''
            }),
          { length: siteConfig.seo.description.limit }
        ),
        url: `${siteConfig.url}/${params.lang}/film/${movie.slug}`,
        images: movie.poster_path ? [
          { url: getTmdbImage({ path: movie.poster_path, size: 'w500' }) },
        ] : undefined,
        type: 'video.movie',
        locale: params.lang,
      }
    };
  } catch {
    return { title: upperFirst(t('common.messages.film_not_found')) };
  }
}

export default async function MoviePage(
  props: {
    params: Promise<{
      lang: string;
      film_id: string;
    }>;
  }
) {
  const params = await props.params;
  const t = await getTranslations();
  const { id: movieId } = getIdFromSlug(params.film_id);
  let movie: Database['public']['Views']['media_movie_full']['Row'];
  try {
    movie = await getMovie(params.lang, movieId);
  } catch {
    return notFound();
  }
  const jsonLd: WithContext<Movie> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title ?? undefined,
    image: movie.poster_path ? getTmdbImage({ path: movie.poster_path, size: 'w500' }) : undefined,
    description: movie.overview ?? undefined,
    datePublished: movie.release_date ?? undefined,
    dateModified: new Date().toISOString(),
    duration: movie.runtime ? toISO8601Duration(movie.runtime) : undefined,
    director: movie.directors
      ?.map(director => ({
        '@type': 'Person',
        name: director.name ?? undefined,
        image: director.profile_path ? getTmdbImage({ path: director.profile_path, size: 'w500' }) : undefined,
      })),
    aggregateRating: movie.vote_average ? {
      '@type': 'AggregateRating',
      ratingValue: movie.vote_average,
      ratingCount: movie.vote_count ?? 0,
      bestRating: 10,
      worstRating: 1,
    } : undefined,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="@container/movie-details flex flex-col gap-4">
        <div className="flex flex-col @4xl/movie-details:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-lg font-medium">{upperFirst(t('common.messages.overview'))}</h2>
            <div className="text-justify text-muted-foreground">
              {movie.overview ?? upperFirst(t('common.messages.no_overview'))}
            </div>
          </div>
          <JustWatchWidget
            id={movie.id}
            title={movie.title ?? ''}
            type="movie"
            className="min-w-[20%]"
          />
        </div>
        <div>
			    <h2 className="text-lg font-medium">{upperFirst(t('common.messages.cast'))}</h2>
          <MovieCasting movie={movie} />
        </div>
      </div>
    </>
  );
}
