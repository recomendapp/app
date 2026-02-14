import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';import { Metadata } from 'next';
import { MovieCreateReview } from './_components/MovieCreateReview';
import { notFound } from 'next/navigation';
import { SupportedLocale } from '@libs/i18n';
import { getMovie } from '@/api/server/medias';

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
  const { id: movieId } = getIdFromSlug(film_id);
  const { data: movie, error } = await getMovie(lang, movieId);
  if (error || !movie) {
    return { title: upperFirst(t('common.messages.film_not_found')) }
  }
  return {
    title: t('pages.review.create.metadata.title', { title: movie.title! }),
    description: t('pages.review.create.metadata.description', { title: movie.title! }),
  };
}

export default async function CreateReview(
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
  return <MovieCreateReview movie={movie} />;
}
