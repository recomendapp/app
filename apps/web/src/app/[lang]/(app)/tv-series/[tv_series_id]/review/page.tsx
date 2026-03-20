import { getIdFromSlug } from '@/utils/get-id-from-slug';
import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SupportedLocale } from '@libs/i18n';
import { TvSeriesReview } from './_components/TvSeriesReview';
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
  const { id: tvSeriesId } = getIdFromSlug(tv_series_id);
  const { data: tvSeries, error } = await getTvSeries(lang, tvSeriesId);
  if (error || !tvSeries) {
    return { title: upperFirst(t('common.messages.tv_series_not_found')) }
  }
  return {
    title: t('pages.review.create.metadata.title', { title: tvSeries.name! }),
    description: t('pages.review.create.metadata.description', { title: tvSeries.name! }),
  };
}

export default async function Review(
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
  return <TvSeriesReview tvSeries={tvSeries} />;
}
