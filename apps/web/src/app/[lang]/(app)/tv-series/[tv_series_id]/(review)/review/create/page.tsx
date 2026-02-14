import { notFound } from 'next/navigation';
import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { upperFirst } from 'lodash';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { TvSeriesCreateReview } from './_components/TvSeriesCreateReview';
import { SupportedLocale } from '@libs/i18n';
import { getTvSeries } from '@/api/server/medias';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      tv_series_id: string;
    }>;
  }
): Promise<Metadata> {
  const { lang, tv_series_id } = await props.params;
  const t = await getTranslations({ locale: lang });
  const { id: serieId } = getIdFromSlug(tv_series_id);
  const { data: tvSeries, error } = await getTvSeries(lang, serieId);
  if (error || !tvSeries) {
    return { title: upperFirst(t('common.messages.tv_series_not_found')) };
  }
  return {
    title: t('pages.review.create.metadata.title', { title: tvSeries.name! }),
    description: t('pages.review.create.metadata.description', { title: tvSeries.name! }),
  };
}

export default async function CreateReview(
  props: {
    params: Promise<{
      lang: SupportedLocale;
      tv_series_id: string;
    }>;
  }
) {
  const { lang, tv_series_id } = await props.params;
  const { id: tvSeriesId } = getIdFromSlug(tv_series_id);
  const { data: tvSeries, error } = await getTvSeries(lang, tvSeriesId);
  if (error || !tvSeries) {
    return notFound();
  }
  return <TvSeriesCreateReview tvSeries={tvSeries} />;
}
