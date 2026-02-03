import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { truncate, upperFirst } from 'lodash';
import { generateAlternates } from '@/lib/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { MovieReviews } from './_components/MovieReviews';
import { SupportedLocale } from '@/translations/locales';
import { getMovie } from '@/api/server/medias';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { Database } from '@recomendapp/types';

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
      title: t('pages.film.reviews.metadata.title', { title: movie.title!, year: new Date(String(movie.release_date)).getFullYear() }),
      description: truncate(
        t('pages.film.reviews.metadata.description', {
          title: movie.title!,
        }),
        { length: siteConfig.seo.description.limit }
      ),
      alternates: generateAlternates(params.lang, `/film/${movie.slug}/reviews`),
      openGraph: {
        siteName: siteConfig.name,
        title: `${t('pages.film.reviews.metadata.title', { title: movie.title!, year: new Date(String(movie.release_date)).getFullYear() })} • ${siteConfig.name}`,
        description: truncate(
          t('pages.film.reviews.metadata.description', {
            title: movie.title!,
          }),
          { length: siteConfig.seo.description.limit }
        ),
        url: `${siteConfig.url}/${params.lang}/film/${movie.slug}/reviews`,
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

export default async function MovieReviewsPage(
  props: {
    params: Promise<{
      lang: string;
      film_id: string;
    }>;
  }
) {
  const params = await props.params;
  const { id: movieId } = getIdFromSlug(params.film_id);
  let movie: Database['public']['Views']['media_movie_full']['Row'];
  try {
    movie = await getMovie(params.lang, movieId);
  } catch {
    return notFound();
  }
  return <MovieReviews movie={movie} />;
}
