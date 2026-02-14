import { siteConfig } from '@/config/site';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { generateAlternates } from '@/lib/i18n/routing';
import { truncate, upperFirst } from 'lodash';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MoviePlaylists } from './_components/MoviePlaylists';
import { SupportedLocale } from '@libs/i18n';
import { getMovie } from '@/api/server/medias';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import { notFound } from 'next/navigation';

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
    title: t('pages.film.playlists.metadata.title', { title: movie.title!, year: new Date(String(movie.releaseDate)).getFullYear() }),
    description: truncate(
      t('pages.film.playlists.metadata.description', {
        title: movie.title!,
      }),
      { length: siteConfig.seo.description.limit }
    ),
    alternates: generateAlternates(lang, `/film/${movie.slug}/playlists`),
    openGraph: {
      siteName: siteConfig.name,
      title: `${t('pages.film.playlists.metadata.title', { title: movie.title!, year: new Date(String(movie.releaseDate)).getFullYear() })} • ${siteConfig.name}`,
      description: truncate(
        t('pages.film.playlists.metadata.description', {
          title: movie.title!,
        }),
        { length: siteConfig.seo.description.limit }
      ),
      url: `${siteConfig.url}/${lang}/film/${movie.slug}/playlists`,
      images: movie.posterPath ? [
        { url: getTmdbImage({ path: movie.posterPath, size: 'w500' }) },
      ] : undefined,
      type: 'video.movie',
      locale: lang,
    }
  };

}

export default async function Reviews(
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
  return <MoviePlaylists movieId={movie.id} />;
}
