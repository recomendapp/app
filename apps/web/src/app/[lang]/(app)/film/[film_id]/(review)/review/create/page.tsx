import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';import { Metadata } from 'next';
import { MovieCreateReview } from './_components/MovieCreateReview';
import { notFound } from 'next/navigation';
import { SupportedLocale } from '@/translations/locales';
import { getMovie } from '@/api/server/medias';
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
  const { id: movieId } = getIdFromSlug(params.film_id);
  try {
    const movie = await getMovie(params.lang, movieId);
    return {
      title: t('pages.review.create.metadata.title', { title: movie.title! }),
      description: t('pages.review.create.metadata.description', { title: movie.title! }),
    };
  } catch {
    return { title: upperFirst(t('common.messages.film_not_found')) };
  }
}

export default async function CreateReview(
  props: {
    params: Promise<{
      lang: string;
      film_id: string;
    }>;
  }
) {
  const params = await props.params;
  const { id: movieId } = getIdFromSlug(params.film_id);
  let movie: Database['public']['Views']['media_movie']['Row'];
  try {
    movie = await getMovie(params.lang, movieId);
  } catch {
    return notFound();
  }
  return <MovieCreateReview movie={movie} />;
}
