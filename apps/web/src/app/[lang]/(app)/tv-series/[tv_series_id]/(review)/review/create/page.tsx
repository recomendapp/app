import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { upperFirst } from 'lodash';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { TvSeriesCreateReview } from './_components/TvSeriesCreateReview';
import { SupportedLocale } from '@/translations/locales';
import { getTvSeries } from '@/api/server/medias';
import { Database } from '@recomendapp/types';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: string;
      tv_series_id: string;
    }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  const { id: serieId } = getIdFromSlug(params.tv_series_id);
  try {
    const serie = await getTvSeries(params.lang, serieId);
    return {
      title: t('pages.review.create.metadata.title', { title: serie.name! }),
      description: t('pages.review.create.metadata.description', { title: serie.name! }),
    };
  } catch {
    return { title: upperFirst(t('common.messages.tv_series_not_found')) };
  }
}

export default async function CreateReview(
  props: {
    params: Promise<{
      lang: string;
      tv_series_id: string;
    }>;
  }
) {
  const params = await props.params;
  const { id: tvSeriesId } = getIdFromSlug(params.tv_series_id);
  let serie: Database['public']['Views']['media_tv_series']['Row'];
  try {
    serie = await getTvSeries(params.lang, tvSeriesId);
  } catch {
    return notFound();
  }
  return <TvSeriesCreateReview tvSeries={serie} />;
}
