import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { truncate, upperFirst } from 'lodash';
import { generateAlternates } from '@/lib/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { MovieReviews } from './_components/MovieReviews';
import { SupportedLocale } from '@libs/i18n';
import { getMovie } from '@/api/server/medias';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { Database } from '@recomendapp/types';

export async function generateMetadata(
  props: {
      params: Promise<{
        lang: SupportedLocale;
        film_id: string;
      }>;
  }
): Promise<Metadata> {
  const { lang, film_id } = await props.params;
  const t = await getTranslations({ locale: lang });
  const { id: movieId} = getIdFromSlug(film_id);
  const { data: movie, error } = await getMovie(lang, movieId);
  if (error || !movie) {
    return { title: upperFirst(t('common.messages.film_not_found')) }
  }
  return {
    title: t('pages.film.reviews.metadata.title', { title: movie.title!, year: new Date(String(movie.releaseDate)).getFullYear() }),
    description: truncate(
      t('pages.film.reviews.metadata.description', {
        title: movie.title!,
      }),
      { length: siteConfig.seo.description.limit }
    ),
    alternates: generateAlternates(lang, `/film/${movie.slug}/reviews`),
    openGraph: {
      siteName: siteConfig.name,
      title: `${t('pages.film.reviews.metadata.title', { title: movie.title!, year: new Date(String(movie.releaseDate)).getFullYear() })} • ${siteConfig.name}`,
      description: truncate(
        t('pages.film.reviews.metadata.description', {
          title: movie.title!,
        }),
        { length: siteConfig.seo.description.limit }
      ),
      url: `${siteConfig.url}/${lang}/film/${movie.slug}/reviews`,
      images: movie.posterPath ? [
        { url: getTmdbImage({ path: movie.posterPath, size: 'w500' }) },
      ] : undefined,
      type: 'video.movie',
      locale: lang,
    }
  };
  
}

export default async function MovieReviewsPage(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      film_id: string;
    }>;
  }
) {
  const { lang, film_id } = await props.params;
  const { id: movieId } = getIdFromSlug(film_id);
  const { data: movie, error } = await getMovie(lang, movieId);
  if (error || !movie) {
    return notFound();
  }
  return <MovieReviews movie={movie} />;
}
